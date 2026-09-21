import { beforeEach, describe, expect, test, vi } from "vitest";
import adminService from "../../services/admin-portal/adminService.js";
import convexService from "../../services/convex/ConvexService.js";

describe("AdminService", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test("listPuzzles - should return puzzles", async () => {
		vi.spyOn(convexService, "query").mockImplementation(async (name) => {
			if (name === "puzzle:wordsearch:list") {
				return {
					items: [{ id: "p1", userId: "u1", completed: false }],
					continueCursor: null,
				};
			}
			return null;
		});

		const result = await adminService.listPuzzles();
		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe("p1");
	});

	test("listShortUrls - should return short urls", async () => {
		vi.spyOn(convexService, "query").mockImplementation(async (name) => {
			if (name === "urlShorter:list") {
				return [
					{
						shortCode: "code1",
						userId: "u1",
						redirectUrl: "http://url.com",
					},
				];
			}
			return null;
		});

		const result = await adminService.listShortUrls();
		expect(result).toHaveLength(1);
		expect(result[0].shortCode).toBe("code1");
	});

	test("storeServiceMapping - should fail if redirectUrlType does not exist", async () => {
		vi.spyOn(convexService, "query").mockImplementation(async (name) => {
			if (name === "redirectUrl:get") {
				return null;
			}
			return null;
		});

		await expect(
			adminService.storeServiceMapping("test-service", "non-existent-type"),
		).rejects.toThrow("Redirect URL type 'non-existent-type' does not exist.");
	});

	test("storeServiceMapping - should succeed if redirectUrlType exists", async () => {
		vi.spyOn(convexService, "query").mockImplementation(async (name) => {
			if (name === "redirectUrl:get") {
				return { url: "http://example.com", type: "existing-type" };
			}
			return null;
		});

		vi.spyOn(convexService, "mutation").mockImplementation(
			async (name, args) => {
				if (name === "serviceMapping:store") {
					return { success: true, data: args };
				}
				return null;
			},
		);

		const result = await adminService.storeServiceMapping(
			"test-service",
			"existing-type",
		);
		expect(result.success).toBe(true);
		expect(result.data.redirectUrlType).toBe("existing-type");
	});

	test("storeRedirectUrl - stores url by type", async () => {
		const mutationSpy = vi
			.spyOn(convexService, "mutation")
			.mockResolvedValueOnce({
				success: true,
				data: { url: "http://test.com", type: "game1" },
			});

		const result = await adminService.storeRedirectUrl(
			"http://test.com",
			"game1",
		);
		expect(mutationSpy).toHaveBeenCalledWith("redirectUrl:store", {
			url: "http://test.com",
			type: "game1",
		});
		expect(result.success).toBe(true);
	});

	test("getRedirectUrl - retrieves url by type", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce({
			url: "http://game2.com",
			type: "game2",
		});

		const result = await adminService.getRedirectUrl("game2");
		expect(result.url).toBe("http://game2.com");
	});

	test("listRedirectUrls - returns all mapped urls", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce([
			{ type: "t1", url: "http://1.com" },
			{ type: "t2", url: "http://2.com" },
		]);

		const list = await adminService.listRedirectUrls();
		expect(list).toHaveLength(2);
	});

	test("addDictionaryWord - proxy to convex mutation", async () => {
		const mutationSpy = vi
			.spyOn(convexService, "mutation")
			.mockResolvedValueOnce({
				success: true,
				id: "1",
				word: "adminword",
				question: "adminquestion",
			});

		const result = await adminService.addDictionaryWord(
			"adminword",
			"adminquestion",
		);
		expect(mutationSpy).toHaveBeenCalledWith("dictionary:add", {
			word: "adminword",
			question: "adminquestion",
		});
		expect(result.word).toBe("adminword");
	});
});
