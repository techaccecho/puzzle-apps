import { beforeEach, describe, expect, test, vi } from "vitest";
import { validateEnv } from "../../config/env.js";
import convexService, {
	ConvexService,
} from "../../services/convex/ConvexService.js";

describe("ConvexService & Environment Configuration (Mock Mode Disabled)", () => {
	describe("Environment Variable Requirements", () => {
		test("fails validation when CONVEX_URL is missing", () => {
			expect(() =>
				validateEnv({
					PORT: "3005",
					API_BASE_URL: "http://localhost:3005/v1/api",
					STATE_SERVICE_URL: "http://localhost:3004",
				}),
			).toThrow(/Missing required environment variable\(s\): CONVEX_URL/);
		});

		test("fails validation when PORT is missing", () => {
			expect(() =>
				validateEnv({
					CONVEX_URL: "https://mock.convex.cloud",
					API_BASE_URL: "http://localhost:3005/v1/api",
					STATE_SERVICE_URL: "http://localhost:3004",
				}),
			).toThrow(/Missing required environment variable\(s\): PORT/);
		});

		test("fails validation when PORT is not a valid number", () => {
			expect(() =>
				validateEnv({
					PORT: "not-a-port",
					CONVEX_URL: "https://mock.convex.cloud",
					API_BASE_URL: "http://localhost:3005/v1/api",
					STATE_SERVICE_URL: "http://localhost:3004",
				}),
			).toThrow(/Invalid environment variable PORT/);
		});

		test("fails validation when API_BASE_URL is missing", () => {
			expect(() =>
				validateEnv({
					CONVEX_URL: "https://mock.convex.cloud",
					PORT: "3005",
					STATE_SERVICE_URL: "http://localhost:3004",
				}),
			).toThrow(/Missing required environment variable\(s\): API_BASE_URL/);
		});

		test("fails validation when STATE_SERVICE_URL is missing", () => {
			expect(() =>
				validateEnv({
					CONVEX_URL: "https://mock.convex.cloud",
					PORT: "3005",
					API_BASE_URL: "http://localhost:3005/v1/api",
				}),
			).toThrow(
				/Missing required environment variable\(s\): STATE_SERVICE_URL/,
			);
		});

		test("fails validation when URLs are malformed", () => {
			expect(() =>
				validateEnv({
					CONVEX_URL: "invalid-url",
					PORT: "3005",
					API_BASE_URL: "http://localhost:3005/v1/api",
					STATE_SERVICE_URL: "http://localhost:3004",
				}),
			).toThrow(/Invalid environment variable CONVEX_URL/);
		});

		test("succeeds when all required environment variables are provided", () => {
			const config = validateEnv({
				CONVEX_URL: "https://test.convex.cloud",
				PORT: "3005",
				API_BASE_URL: "http://localhost:3005/v1/api",
				STATE_SERVICE_URL: "http://localhost:3004",
			});

			expect(config.CONVEX_URL).toBe("https://test.convex.cloud");
			expect(config.PORT).toBe(3005);
			expect(config.API_BASE_URL).toBe("http://localhost:3005/v1/api");
			expect(config.STATE_SERVICE_URL).toBe("http://localhost:3004");
			expect(config.WORDSEARCH_STEP_ID).toBe("step_02_wordsearch");
		});
	});

	describe("Convex Client Mapping & Delegation", () => {
		let mockClient: any;
		let service: ConvexService;

		beforeEach(() => {
			mockClient = {
				query: vi.fn(),
				mutation: vi.fn(),
			};
			service = new ConvexService(mockClient);
		});

		test("correctly maps internal action keys to Convex function paths", () => {
			expect(service.mapFunctionPath("puzzle:wordsearch:create")).toBe(
				"puzzles:create",
			);
			expect(service.mapFunctionPath("puzzle:wordsearch:getById")).toBe(
				"puzzles:getById",
			);
			expect(service.mapFunctionPath("puzzle:wordsearch:getByUserId")).toBe(
				"puzzles:getByUserId",
			);
			expect(service.mapFunctionPath("puzzle:wordsearch:updateProgress")).toBe(
				"puzzles:updateProgress",
			);
			expect(service.mapFunctionPath("puzzle:wordsearch:reset")).toBe(
				"puzzles:reset",
			);
			expect(service.mapFunctionPath("puzzle:wordsearch:list")).toBe(
				"puzzles:list",
			);
			expect(service.mapFunctionPath("urlShorter:create")).toBe(
				"urlShortener:create",
			);
			expect(service.mapFunctionPath("urlShorter:getByCode")).toBe(
				"urlShortener:getByCode",
			);
			expect(service.mapFunctionPath("redirectUrl:delete")).toBe(
				"redirectUrls:deleteUrl",
			);
			expect(service.mapFunctionPath("serviceMapping:delete")).toBe(
				"serviceMappings:deleteMapping",
			);
		});

		test("query delegates to client.query with mapped path", async () => {
			const expectedData = { id: "p1", userId: "u1", completed: true };
			mockClient.query.mockResolvedValueOnce(expectedData);

			const result = await service.query("puzzle:wordsearch:getById", {
				puzzleId: "p1",
			});

			expect(mockClient.query).toHaveBeenCalledWith("puzzles:getById", {
				puzzleId: "p1",
			});
			expect(result).toEqual(expectedData);
		});

		test("mutation delegates to client.mutation with mapped path", async () => {
			const expectedResult = { success: true };
			mockClient.mutation.mockResolvedValueOnce(expectedResult);

			const result = await service.mutation("puzzle:wordsearch:create", {
				id: "p1",
				userId: "u1",
			});

			expect(mockClient.mutation).toHaveBeenCalledWith("puzzles:create", {
				id: "p1",
				userId: "u1",
			});
			expect(result).toEqual(expectedResult);
		});

		test("re-throws query errors with logged context", async () => {
			mockClient.query.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				service.query("puzzle:wordsearch:getById", { puzzleId: "p1" }),
			).rejects.toThrow("Network error");
		});

		test("re-throws mutation errors with logged context", async () => {
			mockClient.mutation.mockRejectedValueOnce(new Error("Database error"));

			await expect(
				service.mutation("puzzle:wordsearch:create", { id: "p1" }),
			).rejects.toThrow("Database error");
		});
	});
});
