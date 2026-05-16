import { describe, test, expect, beforeEach } from "vitest";
import urlShortenerService from "../../services/url-shortner/UrlShortenerService.js";
import convexService from "../../services/convex/ConvexService.js";

describe("UrlShortenerService", () => {
  beforeEach(() => {
    (convexService as any).mockShortUrls.clear();
    (convexService as any).mockRedirectUrls.clear();
  });

  test("generateShortUrl - generates a 7-letter unique code", async () => {
    const userId = "user123";
    const code = await urlShortenerService.generateShortUrl(null, userId);
    expect(code).toHaveLength(7);

    const stored = (convexService as any).mockShortUrls.get(code);
    expect(stored).toBeDefined();
    expect(stored.userId).toBe(userId);
  });

  test("generateShortUrl - uses provided redirectUrl", async () => {
    const customUrl = "http://custom.com";
    const code = await urlShortenerService.generateShortUrl(customUrl, "u1");
    const stored = (convexService as any).mockShortUrls.get(code);
    expect(stored.redirectUrl).toBe(customUrl);
  });

  test("getRedirectUrlByCode - retrieves the correct URL", async () => {
    const code = "abcdefg";
    const target = "http://target.com";
    (convexService as any).mockShortUrls.set(code, {
      shortCode: code,
      redirectUrl: target,
    });

    const result = await urlShortenerService.getRedirectUrlByCode(code);
    expect(result).toBe(target);
  });

  test("getRedirectUrlByCode - returns null for non-existent code", async () => {
    const result = await urlShortenerService.getRedirectUrlByCode("nonexistent");
    expect(result).toBeNull();
  });

  test("getShortUrlsByUser - returns all codes for a user", async () => {
    await urlShortenerService.generateShortUrl("http://1.com", "u1");
    await urlShortenerService.generateShortUrl("http://2.com", "u1");
    await urlShortenerService.generateShortUrl("http://3.com", "u2");

    const u1Urls = await urlShortenerService.getShortUrlsByUser("u1");
    expect(u1Urls).toHaveLength(2);
  });
});
