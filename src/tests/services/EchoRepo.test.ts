import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import apiRoutes from "../../routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("echo SourceForge / ViewCVS Repository", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.restoreAllMocks();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true }),
			}),
		);

		app = Fastify();

		// Register static HTML routes mirroring index.ts
		app.get("/echo", async (request, reply) => {
			const { userId } = request.query as { userId?: string };
			const filePath = path.resolve(__dirname, "../../fe/repo/echo.html");
			let content = fs.readFileSync(filePath, "utf8");

			content = content
				.replace(/{{API_BASE_URL}}/g, "http://localhost:3000/v1/api")
				.replace(/{{USER_ID}}/g, (userId || "guest").trim());

			reply.type("text/html").send(content);
		});

		app.get("/viewcvs/echo", async (request, reply) => {
			const query = request.raw.url?.includes("?")
				? request.raw.url.slice(request.raw.url.indexOf("?"))
				: "";
			return reply.redirect(`/echo${query}`);
		});

		app.get("/archive/echo", async (request, reply) => {
			const query = request.raw.url?.includes("?")
				? request.raw.url.slice(request.raw.url.indexOf("?"))
				: "";
			return reply.redirect(`/echo${query}`);
		});

		// Register API routes
		await app.register(apiRoutes, { prefix: "/v1/api" });
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	test("GET /echo serves the SourceForge / ViewCVS archived repository with 200", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/echo?userId=investigator_01",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toContain("text/html");
		expect(response.body).toContain("SourceForge.net");
		expect(response.body).toContain("echo");
		expect(response.body).toContain("Archived");
		expect(response.body).toContain("INVESTIGATION NODE:");
		expect(response.body).toContain("investigator_01");
		expect(response.body).toContain("viewcvs.js");
		expect(response.body).toContain("echo_part2_0392");

		// Verify that the ViewCVS client script contains portal.c and the recovery sector clue
		const jsPath = path.resolve(__dirname, "../../fe/assets/js/viewcvs.js");
		const jsContent = fs.readFileSync(jsPath, "utf8");
		expect(jsContent).toContain("portal.c");
		expect(jsContent).toContain("echo_part2_0392");
		expect(jsContent).toContain("Sector 0x7F2A");
	});

	test("GET /viewcvs/echo and /archive/echo redirect to /echo preserving query params", async () => {
		const resViewCvs = await app.inject({
			method: "GET",
			url: "/viewcvs/echo?userId=investigator_02",
		});
		expect(resViewCvs.statusCode).toBe(302);
		expect(resViewCvs.headers.location).toBe("/echo?userId=investigator_02");

		const resArchive = await app.inject({
			method: "GET",
			url: "/archive/echo?userId=investigator_02",
		});
		expect(resArchive.statusCode).toBe(302);
		expect(resArchive.headers.location).toBe("/echo?userId=investigator_02");
	});

	test("POST /v1/api/puzzle/echo/complete notifies state-service of Step 15 completion and returns Part 3 passcode", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		});
		vi.stubGlobal("fetch", fetchMock);

		const response = await app.inject({
			method: "POST",
			url: "/v1/api/puzzle/echo/complete",
			payload: {
				userId: "investigator_01",
				stepId: "step_15_git_commit",
			},
		});

		expect(response.statusCode).toBe(200);
		const data = JSON.parse(response.body);
		expect(data.success).toBe(true);
		expect(data.passcodePart3).toBe("echo_part2_0392");
		expect(data.message).toContain("registered successfully");

		expect(fetchMock).toHaveBeenCalled();
		const fetchCallArgs = fetchMock.mock.calls[0];
		expect(fetchCallArgs[0]).toContain("/state-api/player/step/complete");
		const sentBody = JSON.parse(fetchCallArgs[1].body);
		expect(sentBody.userId).toBe("investigator_01");
		expect(sentBody.stepId).toBe("step_15_git_commit");
		expect(sentBody.customData.passcodePart3).toBe("echo_part2_0392");
	});

	test("GET /echo serves enriched navigation tabs, search filter, and narrative artifacts", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/echo?userId=investigator_03",
		});

		expect(response.statusCode).toBe(200);
		// Check UI components
		expect(response.body).toContain("fileFilterInput");
		expect(response.body).toContain("Developer IRC Logs");
		expect(response.body).toContain("Disk Forensics & Sector Map");
		expect(response.body).toContain("Rebuild Team & Metrics");
		expect(response.body).toContain("Hex Dump Mode");
		expect(response.body).toContain("Sound: ON");

		// Check rich narrative elements in viewcvs.js
		const jsPath = path.resolve(__dirname, "../../fe/assets/js/viewcvs.js");
		const jsContent = fs.readFileSync(jsPath, "utf8");
		expect(jsContent).toContain("INCIDENT_REPORT_JULY8.md");
		expect(jsContent).toContain("IRC_LOGS_2026_07.txt");
		expect(jsContent).toContain("ANOMALY_NOTEBOOK_INDEX.md");
		expect(jsContent).toContain("FORENSICS_SECTOR_MAP.txt");
		expect(jsContent).toContain("level4_pale_void.c");
		expect(jsContent).toContain("sound_server.c");
		expect(jsContent).toContain("1420.405");
		expect(jsContent).toContain("WHN_K33P_echo_part2_0392");
		expect(jsContent).toContain("echoarchive5j7x2k.onion");
		expect(jsContent).toContain("formatHexDump");

		// Verify zero Cedric references in the echo repository
		expect(response.body.toLowerCase()).not.toContain("cedric");
		expect(jsContent.toLowerCase()).not.toContain("cedric");

		// Verify authors are dedicated CVS engineers and NOT blog users
		expect(response.body).toContain("vstrickland");
		expect(response.body).toContain("kmatsuda");
		expect(response.body).toContain("hchen");
		expect(response.body).toContain("cvsadmin");
		expect(response.body).toContain("dcorvin");

		// Must NOT contain blog users as authors
		expect(response.body).not.toContain("RetroRex");
		expect(response.body).not.toContain("NullPointer");
		expect(response.body).not.toContain("ByteSmith");
		expect(response.body).not.toContain("ShaderFox");
	});

	test("viewcvs.js switches to 'files' tab and synchronizes directory when target file link is clicked", async () => {
		const jsPath = path.resolve(__dirname, "../../fe/assets/js/viewcvs.js");
		const jsContent = fs.readFileSync(jsPath, "utf8");

		// Verify viewFile switches tab to 'files' if not currently active
		expect(jsContent).toContain('window.echoRepo.switchTab("files")');
		expect(jsContent).toContain('REPO_DATA.activeTab !== "files"');
		expect(jsContent).toContain("renderBreadcrumbs()");
		expect(jsContent).toContain("renderFileList()");
	});
});
