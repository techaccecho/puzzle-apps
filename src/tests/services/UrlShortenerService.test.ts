import { beforeEach, describe, expect, test, vi } from "vitest";
import convexService from "../../services/convex/ConvexService.js";
import urlShortenerService from "../../services/url-shortner/UrlShortenerService.js";

describe("UrlShortenerService Integration with Convex", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test("generateShortUrl - throws error if redirectUrl type is not found", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce(null);

		await expect(
			urlShortenerService.generateShortUrl(null, "user1", "unknown-type"),
		).rejects.toThrow("Redirect URL for type 'unknown-type' not found");
	});

	test("generateShortUrl - succeeds if redirectUrl type exists", async () => {
		vi.spyOn(convexService, "query").mockImplementation(async (name) => {
			if (name === "redirectUrl:get") {
				return { url: "https://success.com", type: "known-type" };
			}
			if (name === "urlShorter:getByCode") {
				return null; // unique
			}
			return null;
		});

		const mutationSpy = vi
			.spyOn(convexService, "mutation")
			.mockResolvedValue({ success: true });

		const shortCode = await urlShortenerService.generateShortUrl(
			null,
			"user1",
			"known-type",
		);
		expect(shortCode).toBeDefined();
		expect(shortCode.length).toBe(7);

		expect(mutationSpy).toHaveBeenCalledWith(
			"urlShorter:create",
			expect.objectContaining({
				shortCode,
				redirectUrl: "https://success.com",
				userId: "user1",
			}),
		);
	});

	test("generateShortUrl - bypasses DB query if direct redirectUrl is provided", async () => {
		const querySpy = vi.spyOn(convexService, "query").mockResolvedValue(null);
		vi.spyOn(convexService, "mutation").mockResolvedValue({ success: true });

		const shortCode = await urlShortenerService.generateShortUrl(
			"https://direct.com",
			"user1",
		);
		expect(shortCode).toBeDefined();
		expect(shortCode.length).toBe(7);
		expect(querySpy).not.toHaveBeenCalledWith(
			"redirectUrl:get",
			expect.anything(),
		);
	});

	test("getShortUrlInfo - returns url info by short code", async () => {
		const mockData = {
			shortCode: "test123",
			redirectUrl: "https://project-echo-game.vercel.app",
			userId: "u1",
		};
		vi.spyOn(convexService, "query").mockResolvedValueOnce(mockData);

		const info = await urlShortenerService.getShortUrlInfo("test123");
		expect(info).toEqual(mockData);
	});

	test("getRedirectUrlByCode - returns redirectUrl from code", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce({
			shortCode: "test123",
			redirectUrl: "https://mapped-service.com",
		});

		const url = await urlShortenerService.getRedirectUrlByCode("test123");
		expect(url).toBe("https://mapped-service.com");
	});
});
