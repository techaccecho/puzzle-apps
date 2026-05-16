import { describe, test, expect, beforeEach } from "vitest";
import wordSearchService from "../../services/word-search/WordSearchService.js";
import convexService from "../../services/convex/ConvexService.js";
import dictionaryService from "../../services/word-search/DictionaryService.js";

describe("WordSearchService", () => {
  beforeEach(() => {
    (convexService as any).mockPuzzles.clear();
    (convexService as any).mockDictionary.clear();
    (wordSearchService as any).puzzleCache.clear();
  });

  describe("generatePuzzle", () => {
    test("creates a new puzzle if none exists for user", async () => {
      // Seed dictionary so it can pick words
      await dictionaryService.addWord("apple", "q1");
      await dictionaryService.addWord("banana", "q2");
      await dictionaryService.addWord("cherry", "q3");
      await dictionaryService.addWord("date", "q4");
      await dictionaryService.addWord("elderberry", "q5");
      await dictionaryService.addWord("fig", "q6");
      await dictionaryService.addWord("grape", "q7");

      const userId = "u1";
      const puzzle = await wordSearchService.generatePuzzle(userId);

      expect(puzzle).toBeDefined();
      expect(puzzle.userId).toBe(userId);
      expect(puzzle.grid).toBeDefined();
      expect(puzzle.clues).toHaveLength(7); // ShortUrl is 7 chars, so 7 words
    });

    test("returns existing active puzzle if one exists", async () => {
      const existing = {
        id: "p1",
        userId: "u1",
        completed: false,
        words: ["test"],
        clues: [{ word: "test", question: "q" }],
        grid: [[]],
        size: 10,
        foundWords: [],
      };
      (convexService as any).mockPuzzles.set("p1", existing);

      const puzzle = await wordSearchService.generatePuzzle("u1");
      expect(puzzle.id).toBe("p1");
    });
  });

  describe("validateWord", () => {
    const puzzleId = "p1";
    const userId = "u1";
    const words = ["backend", "express"];
    const grid = Array(12)
      .fill(0)
      .map(() => Array(12).fill("a"));
    // Place 'backend' at (0,0) horizontally
    for (let i = 0; i < "backend".length; i++) grid[0][i] = "backend"[i];

    const puzzle = {
      id: puzzleId,
      userId: userId,
      words: words,
      clues: words.map((w) => ({ word: w, question: "q" })),
      grid: grid,
      size: 12,
      foundWords: [],
      completed: false,
    };

    beforeEach(() => {
      (convexService as any).mockPuzzles.set(
        puzzleId,
        JSON.parse(JSON.stringify(puzzle))
      );
      (wordSearchService as any).puzzleCache.set(
        puzzleId,
        (convexService as any).mockPuzzles.get(puzzleId)
      );
    });

    test("validates a correct word forward", async () => {
      const cells = "backend".split("").map((_, i) => ({ x: i, y: 0 }));
      const result = await wordSearchService.validateWord(
        puzzleId,
        "backend",
        userId,
        cells
      );

      expect(result.success).toBe(true);
      expect(result.word).toBe("backend");
      expect(result.cells).toEqual(cells);
    });

    test("validates a correct word backward", async () => {
      const cells = "backend"
        .split("")
        .map((_, i) => ({ x: i, y: 0 }))
        .reverse();
      const result = await wordSearchService.validateWord(
        puzzleId,
        "dnekcab",
        userId,
        cells
      );

      expect(result.success).toBe(true);
      expect(result.word).toBe("backend");
      // cells should be reversed back to forward order in response
      expect(result.cells).toEqual(cells.slice().reverse());
    });

    test("rejects an invalid word", async () => {
      const result = await wordSearchService.validateWord(
        puzzleId,
        "invalid",
        userId,
        []
      );
      expect(result.success).toBe(false);
    });

    test("denies access if userId mismatch", async () => {
      const result = await wordSearchService.validateWord(
        puzzleId,
        "backend",
        "wrongUser",
        []
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Access denied");
    });

    test("completes puzzle when last word is found", async () => {
      // Find first word
      await wordSearchService.validateWord(puzzleId, "backend", userId, []);
      // Find second word
      const result = await wordSearchService.validateWord(
        puzzleId,
        "express",
        userId,
        []
      );

      expect(result.success).toBe(true);
      const cached = (wordSearchService as any).puzzleCache.get(puzzleId);
      expect(cached.foundWords).toHaveLength(2);
      // In mock mode, updateProgress is called
      const dbPuzzle = (convexService as any).mockPuzzles.get(puzzleId);
      expect(dbPuzzle.completed).toBe(true);
    });

    test("returns false if puzzle missing in cache and DB", async () => {
      const result = await wordSearchService.validateWord(
        "missing",
        "word",
        "user",
        []
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("Puzzle not found");
    });

    test("updates cells if existing entry has no cells", async () => {
      const puzzleWithNoCells = {
        id: "pNoCells",
        userId: "u1",
        words: ["apple"],
        foundWords: [{ word: "apple" }], // Old format string-like or missing cells
        completed: false,
      };
      (convexService as any).mockPuzzles.set("pNoCells", puzzleWithNoCells);
      (wordSearchService as any).puzzleCache.set("pNoCells", puzzleWithNoCells);

      const cells = [{ x: 0, y: 0 }];
      const result = await wordSearchService.validateWord(
        "pNoCells",
        "apple",
        "u1",
        cells
      );

      expect(result.success).toBe(true);
      const entry = puzzleWithNoCells.foundWords.find(
        (fw: any) => fw.word === "apple"
      );
      expect(entry.cells).toEqual(cells);
    });
  });

  describe("getPuzzleCompletionData", () => {
    test("returns shortUrl for completed puzzle", async () => {
      const puzzleId = "p1";
      const userId = "u1";
      const puzzle = {
        id: puzzleId,
        userId: userId,
        words: ["a"],
        foundWords: ["a"],
        shortUrl: "abc",
      };
      (convexService as any).mockPuzzles.set(puzzleId, puzzle);
      (wordSearchService as any).puzzleCache.set(puzzleId, puzzle);

      const result = await wordSearchService.getPuzzleCompletionData(
        puzzleId,
        userId
      );
      expect(result!.shortUrl).toBe("abc");
    });
  });
});
