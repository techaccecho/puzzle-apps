import { describe, test, expect, beforeEach } from "vitest";
import dictionaryService from "../../services/word-search/DictionaryService.js";
import convexService from "../../services/convex/ConvexService.js";

describe("DictionaryService", () => {
  beforeEach(() => {
    (convexService as any).mockDictionary.clear();
  });

  test("addWord - calls convex mutation", async () => {
    await dictionaryService.addWord("test", "question");
    const items = Array.from((convexService as any).mockDictionary.values());
    expect(items.some((i: any) => i.word === "test")).toBe(true);
  });

  test("getRandomWords - returns requested count", async () => {
    // Seed with 10 words
    for (let i = 0; i < 10; i++) {
      await dictionaryService.addWord(`word${i}`, `q${i}`);
    }
    const words = await dictionaryService.getRandomWords(3);
    expect(words).toHaveLength(3);
  });

  test("getRandomWords - returns fallback if dictionary empty", async () => {
    const words = await dictionaryService.getRandomWords(2);
    expect(words).toHaveLength(2);
    expect(words[0]).toHaveProperty("word");
  });

  test("getWordsByStartingLetters - matches letters correctly", async () => {
    await dictionaryService.addWord("apple", "a fruit");
    await dictionaryService.addWord("banana", "yellow");

    const selected = await dictionaryService.getWordsByStartingLetters("ab");
    expect(selected).toHaveLength(2);
    expect(selected[0].word).toBe("apple");
    expect(selected[1].word).toBe("banana");
  });

  test("getWordsByStartingLetters - uses fallback for missing letters", async () => {
    const selected = await dictionaryService.getWordsByStartingLetters("z");
    expect(selected).toHaveLength(1);
    expect(selected[0].word).toBe("zword");
  });
});
