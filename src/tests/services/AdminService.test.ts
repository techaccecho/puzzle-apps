import { describe, test, expect, beforeEach } from "vitest";
import adminService from "../../services/admin-portal/adminService.js";
import convexService from "../../services/convex/ConvexService.js";

describe("AdminService", () => {
  beforeEach(() => {
    (convexService as any).mockRedirectUrls.clear();
    (convexService as any).mockDictionary.clear();
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
