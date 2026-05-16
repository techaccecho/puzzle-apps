import { describe, test, expect, beforeEach } from "vitest";
import adminService from "../../services/admin-portal/adminService.js";
import convexService from "../../services/convex/ConvexService.js";

describe("AdminService", () => {
  beforeEach(() => {
    (convexService as any).mockRedirectUrls.clear();
    (convexService as any).mockDictionary.clear();
    (convexService as any).mockServiceMappings.clear();
    (convexService as any).redirectUrlCache.clear();
    (convexService as any).mockPuzzles.clear();
    (convexService as any).mockShortUrls.clear();
  });

  test("listPuzzles - should return puzzles", async () => {
    (convexService as any).mockPuzzles.set("p1", { id: "p1", userId: "u1", completed: false });
    const result = await adminService.listPuzzles();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("p1");
  });

  test("listShortUrls - should return short urls", async () => {
    (convexService as any).mockShortUrls.set("code1", { shortCode: "code1", userId: "u1", redirectUrl: "http://url.com" });
    const result = await adminService.listShortUrls();
    expect(result).toHaveLength(1);
    expect(result[0].shortCode).toBe("code1");
  });

  test("storeServiceMapping - should fail if redirectUrlType does not exist", async () => {
    await expect(
      adminService.storeServiceMapping("test-service", "non-existent-type")
    ).rejects.toThrow("Redirect URL type 'non-existent-type' does not exist.");
  });

  test("storeServiceMapping - should succeed if redirectUrlType exists", async () => {
    await adminService.storeRedirectUrl("http://example.com", "existing-type");
    const result = await adminService.storeServiceMapping("test-service", "existing-type");
    expect(result.success).toBe(true);
    expect(result.data.redirectUrlType).toBe("existing-type");
  });

  test("storeRedirectUrl - stores url by type", async () => {
    await adminService.storeRedirectUrl("http://test.com", "game1");
    const stored = (convexService as any).mockRedirectUrls.get("game1");
    expect(stored.url).toBe("http://test.com");
  });

  test("getRedirectUrl - retrieves url by type", async () => {
    (convexService as any).mockRedirectUrls.set("game2", {
      url: "http://game2.com",
    });
    const result = await adminService.getRedirectUrl("game2");
    expect(result.url).toBe("http://game2.com");
  });

  test("listRedirectUrls - returns all mapped urls", async () => {
    await adminService.storeRedirectUrl("http://1.com", "t1");
    await adminService.storeRedirectUrl("http://2.com", "t2");
    const list = await adminService.listRedirectUrls();
    expect(list).toHaveLength(2);
  });

  test("addDictionaryWord - proxy to convex mutation", async () => {
    await adminService.addDictionaryWord("adminword", "adminquestion");
    const items = Array.from((convexService as any).mockDictionary.values());
    expect(items.some((i: any) => i.word === "adminword")).toBe(true);
  });
});
