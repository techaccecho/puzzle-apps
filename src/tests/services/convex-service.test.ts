import { describe, test, expect, beforeEach } from "vitest";
import convexService from "../../services/convex/convex-service.js";

describe("ConvexService", () => {
  beforeEach(() => {
    (convexService as any).mockPuzzles.clear();
    (convexService as any).mockRedirectUrls.clear();
    (convexService as any).redirectUrlCache.clear();
    (convexService as any).mockServiceMappings.clear();
    (convexService as any).mockShortUrls.clear();
  });

  describe("query (Mock Mode)", () => {
    test("wordSearchPuzzles:getById - returns puzzle if exists and user matches", async () => {
      const puzzle = {
        id: "p1",
        userId: "u1",
        clues: [{ word: "test", question: "q" }],
        foundWords: [],
        completed: false,
      };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      const result = await convexService.query("wordSearchPuzzles:getById", {
        puzzleId: "p1",
        userId: "u1",
      });
      expect(result).toEqual(puzzle);
    });

    test("wordSearchPuzzles:getById - returns null if user mismatch", async () => {
      const puzzle = { id: "p1", userId: "u1" };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      const result = await convexService.query("wordSearchPuzzles:getById", {
        puzzleId: "p1",
        userId: "u2",
      });
      expect(result).toBeNull();
    });

    test("wordSearchPuzzles:getByUserId - returns active puzzle", async () => {
      const puzzle = { id: "p1", userId: "u1", completed: false };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      const result = await convexService.query("wordSearchPuzzles:getByUserId", {
        userId: "u1",
      });
      expect(result).toEqual(puzzle);
    });

    test("shortUrls:getByCode - returns short url data", async () => {
      const data = { shortCode: "abc", url: "http://test.com" };
      (convexService as any).mockShortUrls.set("abc", data);

      const result = await convexService.query("shortUrls:getByCode", {
        shortCode: "abc",
      });
      expect(result).toEqual(data);
    });

    test("redirectUrls:get - returns null if not found", async () => {
      const result = await convexService.query("redirectUrls:get", {
        type: "non-existent",
      });
      expect(result).toBeNull();
    });

    test("redirectUrls:get - returns cached value", async () => {
      // Setup mock
      (convexService as any).mockRedirectUrls.set("test-cache", { url: "http://cached.com" });
      
      // First call (cache miss)
      const result1 = await convexService.query("redirectUrls:get", { type: "test-cache" });
      expect(result1.url).toBe("http://cached.com");

      // Update mock directly (cache should still have old value)
      (convexService as any).mockRedirectUrls.set("test-cache", { url: "http://updated.com" });
      
      const result2 = await convexService.query("redirectUrls:get", { type: "test-cache" });
      expect(result2.url).toBe("http://cached.com"); // Cache hit
    });

    test("dictionaries:get - returns word by id", async () => {
      (convexService as any).mockDictionary.set("999", {
        id: "999",
        word: "jest",
      });
      const result = await convexService.query("dictionaries:get", { id: "999" });
      expect(result.word).toBe("jest");
    });

    test("redirectUrls:delete - removes redirect url and clears cache", async () => {
      // Seed
      await convexService.mutation("redirectUrls:store", { type: "to-delete", url: "http://delete.me" });
      
      // Verify exists and is cached
      const result1 = await convexService.query("redirectUrls:get", { type: "to-delete" });
      expect(result1.url).toBe("http://delete.me");
      
      // Delete
      await convexService.mutation("redirectUrls:delete", { type: "to-delete" });
      
      // Verify gone
      const result2 = await convexService.query("redirectUrls:get", { type: "to-delete" });
      expect(result2).toBeNull();
    });

    test("serviceMappings:get - returns mapping if exists", async () => {
      (convexService as any).mockServiceMappings.set("test-service", { redirectUrlType: "test-type" });
      const result = await convexService.query("serviceMappings:get", { serviceName: "test-service" });
      expect(result.redirectUrlType).toBe("test-type");
    });
  });

  describe("mutation (Mock Mode)", () => {
    test("wordSearchPuzzles:create - stores puzzle", async () => {
      const puzzle = { id: "p2", userId: "u1" };
      const result = await convexService.mutation(
        "wordSearchPuzzles:create",
        puzzle
      );
      expect(result.success).toBe(true);
      expect((convexService as any).mockPuzzles.get("p2")).toEqual(puzzle);
    });

    test("wordSearchPuzzles:updateProgress - updates foundWords and completion", async () => {
      const puzzle = {
        id: "p1",
        clues: [{ word: "apple", question: "q" }],
        foundWords: [],
        completed: false,
      };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      await convexService.mutation("wordSearchPuzzles:updateProgress", {
        puzzleId: "p1",
        userId: "u1",
        word: "apple",
        foundWords: [{ word: "apple", cells: [] }],
        allFound: true,
      });

      const updated = (convexService as any).mockPuzzles.get("p1");
      expect(updated.completed).toBe(true);
      expect(updated.foundWords).toHaveLength(1);
    });

    test("dictionaries:add - adds new word with auto-increment id", async () => {
      const initialSize = (convexService as any).mockDictionary.size;
      const result = await convexService.mutation("dictionaries:add", {
        word: "newword",
        question: "?",
      });
      expect(result.success).toBe(true);
      expect((convexService as any).mockDictionary.size).toBe(initialSize + 1);
      expect(result.word).toBe("newword");
    });
  });
});
