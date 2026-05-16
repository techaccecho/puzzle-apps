import { BaseApiService } from "../BaseApiService.js";
import convexService from "../convex/ConvexService.js";

class UrlShortenerService extends BaseApiService {
  constructor() {
    super();
  }

  async generateShortUrl(redirectUrl: string | null, userId: string) {
    let urlToShorten = redirectUrl;
    if (!urlToShorten) {
      try {
        const result = await convexService.query("redirectUrl:get", {
          type: "default",
        });
        urlToShorten = result ? result.url : "https://example.com/default";
      } catch (error) {
        console.error("Error fetching default redirect URL:", error);
        urlToShorten = "https://example.com/default";
      }
    }

    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let shortCode = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      shortCode = "";
      let tempAlphabet = alphabet.split("");
      for (let i = 0; i < 7; i++) {
        const charIndex = Math.floor(Math.random() * tempAlphabet.length);
        shortCode += tempAlphabet.splice(charIndex, 1)[0];
      }

      try {
        const existing = await convexService.query("urlShorter:getByCode", {
          shortCode,
        });
        if (!existing) {
          isUnique = true;
        }
      } catch (error) {
        console.error("Error checking uniqueness:", error);
        isUnique = true;
      }
      attempts++;
    }

    try {
      await convexService.mutation("urlShorter:create", {
        shortCode,
        redirectUrl: urlToShorten,
        userId,
        expiresAt: Date.now() + 24 * 3600000,
      });
      return shortCode;
    } catch (error) {
      console.error("Error generating short URL:", error);
      return shortCode;
    }
  }

  async getShortUrlInfo(shortCode: string) {
    try {
      const result = await convexService.query("urlShorter:getByCode", {
        shortCode,
      });
      return result;
    } catch (error) {
      console.error("Error retrieving short URL info:", error);
      return null;
    }
  }

  async getShortUrlsByUser(userId: string) {
    try {
      return await convexService.query("urlShorter:getByUser", { userId });
    } catch (error) {
      console.error("Error retrieving short URLs for user:", error);
      return [];
    }
  }

  async getRedirectUrlByCode(shortCode: string) {
    try {
      const result = await convexService.query("urlShorter:getByCode", {
        shortCode,
      });
      if (result && result.redirectUrl) {
        return result.redirectUrl;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving redirect URL:", error);
      return null;
    }
  }
}

export default new UrlShortenerService();
