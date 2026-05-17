import { describe, test, expect, beforeEach, vi } from "vitest";
import urlShortenerService from "../../services/url-shortner/url-shortener-service.js";
import convexService from "../../services/convex/convex-service.js";

describe("UrlShortenerService Integration with Convex (Mock Mode)", () => {
  test("generateShortUrl - throws error if redirectUrl type is not found", async () => {
    (convexService as any).mockRedirectUrls.clear();
    (convexService as any).redirectUrlCache.clear();
    await expect(
      urlShortenerService.generateShortUrl(null, "user1", "unknown-type")
    ).rejects.toThrow("Redirect URL for type 'unknown-type' not found");
  });

  test("generateShortUrl - succeeds if redirectUrl type exists", async () => {
    (convexService as any).mockRedirectUrls.clear();
    (convexService as any).redirectUrlCache.clear();
    // Seed the mock DB
    await convexService.mutation("redirectUrls:store", { 
      url: "https://success.com", 
      type: "known-type" 
    });

    const shortCode = await urlShortenerService.generateShortUrl(null, "user1", "known-type");
    expect(shortCode).toBeDefined();
    expect(shortCode.length).toBe(7);

    const info = await urlShortenerService.getShortUrlInfo(shortCode);
    expect(info.redirectUrl).toBe("https://success.com");
  });

  test("generateShortUrl - bypasses DB if direct redirectUrl is provided", async () => {
    const shortCode = await urlShortenerService.generateShortUrl("https://direct.com", "user1");
    const info = await urlShortenerService.getShortUrlInfo(shortCode);
    expect(info.redirectUrl).toBe("https://direct.com");
  });

  test("generateShortUrl - uses seeded redirect URL from config/redirectUrlData.json", async () => {
    // Seed it manually for the test to ensure it's present regardless of global state/cleanup
    await convexService.mutation("redirectUrls:store", { 
      url: "https://project-echo-game.vercel.app", 
      type: "puzzle-wordsearch" 
    });

    const shortCode = await urlShortenerService.generateShortUrl(null, "user-seeded", "puzzle-wordsearch");
    expect(shortCode).toBeDefined();
    
    const info = await urlShortenerService.getShortUrlInfo(shortCode);
    expect(info.redirectUrl).toBe("https://project-echo-game.vercel.app");
  });

  test("generateShortUrl - uses service mapping to find redirect URL type", async () => {
    // Seed redirect URL
    await convexService.mutation("redirectUrls:store", { 
      url: "https://mapped-service.com", 
      type: "mapped-type" 
    });

    // Seed service mapping
    await convexService.mutation("serviceMappings:store", {
      serviceName: "test-service",
      redirectUrlType: "mapped-type"
    });

    // We can't easily call WordSearchService here without more setup, 
    // but we can verify the logic that WordSearchService will use.
    
    const mapping = await convexService.query("serviceMappings:get", { serviceName: "test-service" });
    expect(mapping.redirectUrlType).toBe("mapped-type");

    const shortCode = await urlShortenerService.generateShortUrl(null, "user-mapped", mapping.redirectUrlType);
    const info = await urlShortenerService.getShortUrlInfo(shortCode);
    expect(info.redirectUrl).toBe("https://mapped-service.com");
  });
});
