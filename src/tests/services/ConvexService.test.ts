import { describe, test, expect, beforeEach } from "vitest";
import convexService from "../../services/convex/ConvexService.js";

describe("ConvexService", () => {
  beforeEach(() => {
    (convexService as any).mockPuzzles.clear();
    (convexService as any).mockRedirectUrls.clear();
    (convexService as any).mockShortUrls.clear();
  });

  describe("query (Mock Mode)", () => {
    test("puzzle:wordsearch:getById - returns puzzle if exists and user matches", async () => {
      const puzzle = {
        id: "p1",
        userId: "u1",
        words: ["test"],
        foundWords: [],
        completed: false,
      };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      const result = await convexService.query("puzzle:wordsearch:getById", {
        puzzleId: "p1",
        userId: "u1",
      });
      expect(result).toEqual(puzzle);
    });

    test("puzzle:wordsearch:getById - returns null if user mismatch", async () => {
      const puzzle = { id: "p1", userId: "u1" };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      const result = await convexService.query("puzzle:wordsearch:getById", {
        puzzleId: "p1",
        userId: "u2",
      });
      expect(result).toBeNull();
    });

    test("puzzle:wordsearch:getByUserId - returns active puzzle", async () => {
      const puzzle = { id: "p1", userId: "u1", completed: false };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      const result = await convexService.query("puzzle:wordsearch:getByUserId", {
        userId: "u1",
      });
      expect(result).toEqual(puzzle);
    });

    test("urlShorter:getByCode - returns short url data", async () => {
      const data = { shortCode: "abc", url: "http://test.com" };
      (convexService as any).mockShortUrls.set("abc", data);

      const result = await convexService.query("urlShorter:getByCode", {
        shortCode: "abc",
      });
      expect(result).toEqual(data);
    });

    test("redirectUrl:get - returns default if not found", async () => {
      const result = await convexService.query("redirectUrl:get", {
        type: "default",
      });
      expect(result).toEqual({ url: "https://project-echo-game.vercel.app" });
    });

    test("dictionary:get - returns word by id", async () => {
      (convexService as any).mockDictionary.set("999", {
        id: "999",
        word: "jest",
      });
      const result = await convexService.query("dictionary:get", { id: "999" });
      expect(result.word).toBe("jest");
    });
  });

  describe("mutation (Mock Mode)", () => {
    test("puzzle:wordsearch:create - stores puzzle", async () => {
      const puzzle = { id: "p2", userId: "u1" };
      const result = await convexService.mutation(
        "puzzle:wordsearch:create",
        puzzle
      );
      expect(result.success).toBe(true);
      expect((convexService as any).mockPuzzles.get("p2")).toEqual(puzzle);
    });

    test("puzzle:wordsearch:updateProgress - updates foundWords and completion", async () => {
      const puzzle = {
        id: "p1",
        words: ["apple"],
        foundWords: [],
        completed: false,
      };
      (convexService as any).mockPuzzles.set("p1", puzzle);

      await convexService.mutation("puzzle:wordsearch:updateProgress", {
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

    test("dictionary:add - adds new word with auto-increment id", async () => {
      const initialSize = (convexService as any).mockDictionary.size;
      const result = await convexService.mutation("dictionary:add", {
        word: "newword",
        question: "?",
      });
      expect(result.success).toBe(true);
      expect((convexService as any).mockDictionary.size).toBe(initialSize + 1);
      expect(result.word).toBe("newword");
    });
  });
});
