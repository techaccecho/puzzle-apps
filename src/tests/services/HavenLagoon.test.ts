import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import apiRoutes from "../../routes/api.js";
import asciiArtService from "../../services/ascii-art/AsciiArtService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Haven Lagoon Routing & Authorization", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.restoreAllMocks();
		asciiArtService.clearCache();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			}),
		);

		app = Fastify();

		// Register static HTML routes mirroring index.ts
		app.get("/unlisted_lagoon.html", async (request, reply) => {
			const { userId } = request.query as { userId?: string };

			if (!userId || userId.trim() === "") {
				const accessDeniedPath = path.resolve(
					__dirname,
					"../../fe/haven/access-denied.html",
				);
				let content = fs.readFileSync(accessDeniedPath, "utf8");
				content = content
					.replace(/{{USER_ID}}/g, "anonymous")
					.replace(/{{RECALIBRATE_URL}}/g, "/asciiart/puzzle");

				reply.status(404).type("text/html").send(content);
				return;
			}

			const isCompleted = await asciiArtService.isPasscodeCompleted(
				userId.trim(),
			);
			if (!isCompleted) {
				const accessDeniedPath = path.resolve(
					__dirname,
					"../../fe/haven/access-denied.html",
				);
				let content = fs.readFileSync(accessDeniedPath, "utf8");
				const recalibrateUrl = `/asciiart/puzzle?userId=${encodeURIComponent(
					userId.trim(),
				)}`;
				content = content
					.replace(/{{USER_ID}}/g, userId.trim())
					.replace(/{{RECALIBRATE_URL}}/g, recalibrateUrl);

				reply.status(404).type("text/html").send(content);
				return;
			}

			const filePath = path.resolve(
				__dirname,
				"../../fe/haven/unlisted_lagoon.html",
			);
			let content = fs.readFileSync(filePath, "utf8");
			content = content
				.replace(/{{API_BASE_URL}}/g, "http://localhost:3000/v1/api")
				.replace(/{{USER_ID}}/g, userId.trim());
			reply.type("text/html").send(content);
		});

		app.get("/haven/lagoon", async (request, reply) => {
			const query = request.raw.url?.includes("?")
				? request.raw.url.slice(request.raw.url.indexOf("?"))
				: "";
			return reply.redirect(`/unlisted_lagoon.html${query}`);
		});

		app.get("/haven", async (request, reply) => {
			const query = request.raw.url?.includes("?")
				? request.raw.url.slice(request.raw.url.indexOf("?"))
				: "";
			return reply.redirect(`/unlisted_lagoon.html${query}`);
		});

		// Register API routes
		await app.register(apiRoutes, { prefix: "/v1/api" });
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		asciiArtService.clearCache();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	test("GET /unlisted_lagoon.html denies access with 404 when userId is missing", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/unlisted_lagoon.html",
		});

		expect(response.statusCode).toBe(404);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain("[ACCESS DENIED] UNLISTED DIRECTORY LOCKED");
		expect(response.body).toContain("anonymous");
		expect(response.body).toContain("/asciiart/puzzle");
		expect(response.body).not.toContain("K33P");
	});

	test("GET /unlisted_lagoon.html denies access with 404 when Step 7 passcode is not completed", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/unlisted_lagoon.html?userId=agent_echo_unsolved",
		});

		expect(response.statusCode).toBe(404);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain("[ACCESS DENIED] UNLISTED DIRECTORY LOCKED");
		expect(response.body).toContain("agent_echo_unsolved");
		expect(response.body).toContain(
			"/asciiart/puzzle?userId=agent_echo_unsolved",
		);
		expect(response.body).not.toContain("K33P");
	});

	test("GET /unlisted_lagoon.html serves unlisted lagoon with 200 when Step 7 passcode is completed", async () => {
		// Mark Step 7 passcode as completed for this user
		asciiArtService.setPasscodeCompleted("agent_echo_01", true);

		const response = await app.inject({
			method: "GET",
			url: "/unlisted_lagoon.html?userId=agent_echo_01",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain("[ECHO_ARCHIVE_SECURE_NODE_109]");
		expect(response.body).toContain(
			"WARNING: UNLISTED DIRECTORY. ACCESS AUTHORIZED.",
		);
		expect(response.body).toContain("PASSWORD PART 2 RECOVERED:");
		expect(response.body).toContain("K33P");
		expect(response.body).toContain(
			"WW91VHViZTogaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQpHaXRIdWI6IHRlY2hhY2NlY2hvL2VjaG8taGF2ZW4tc2Vx",
		);
		expect(response.body).toContain("agent_echo_01");
	});

	test("GET /haven and /haven/lagoon redirect to /unlisted_lagoon.html preserving query params", async () => {
		const resHaven = await app.inject({
			method: "GET",
			url: "/haven?userId=agent_echo_02",
		});
		expect(resHaven.statusCode).toBe(302);
		expect(resHaven.headers.location).toBe(
			"/unlisted_lagoon.html?userId=agent_echo_02",
		);

		const resLagoon = await app.inject({
			method: "GET",
			url: "/haven/lagoon?userId=agent_echo_02",
		});
		expect(resLagoon.statusCode).toBe(302);
		expect(resLagoon.headers.location).toBe(
			"/unlisted_lagoon.html?userId=agent_echo_02",
		);
	});

	test("POST /v1/api/puzzle/haven/complete notifies state-service and registers step completion", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		});
		vi.stubGlobal("fetch", fetchMock);

		const response = await app.inject({
			method: "POST",
			url: "/v1/api/puzzle/haven/complete",
			payload: {
				userId: "agent_echo_01",
				stepId: "step_08_haven_redirect",
			},
		});

		expect(response.statusCode).toBe(200);
		const data = JSON.parse(response.body);
		expect(data.success).toBe(true);
		expect(data.message).toContain("Haven step registered successfully");
		expect(fetchMock).toHaveBeenCalled();
	});
});
