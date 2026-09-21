import { beforeEach, describe, expect, test, vi } from "vitest";
import convexService from "../../services/convex/ConvexService.js";
import dictionaryService from "../../services/word-search/DictionaryService.js";

describe("DictionaryService", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test("addWord - calls convex mutation", async () => {
		const mutationSpy = vi
			.spyOn(convexService, "mutation")
			.mockResolvedValueOnce({
				success: true,
				id: "1",
				word: "test",
				question: "question",
			});

		const result = await dictionaryService.addWord("test", "question");
		expect(mutationSpy).toHaveBeenCalledWith("dictionary:add", {
			word: "test",
			question: "question",
		});
		expect(result.word).toBe("test");
	});

	test("getRandomWords - returns requested count", async () => {
		const mockWords = Array.from({ length: 10 }, (_, i) => ({
			id: String(i),
			word: `word${i}`,
			question: `q${i}`,
		}));

		vi.spyOn(convexService, "query").mockResolvedValueOnce({
			items: mockWords,
			continueCursor: null,
		});

		const words = await dictionaryService.getRandomWords(3);
		expect(words).toHaveLength(3);
	});

	test("getRandomWords - returns fallback if dictionary empty", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce({
			items: [],
			continueCursor: null,
		});

		const words = await dictionaryService.getRandomWords(2);
		expect(words).toHaveLength(2);
		expect(words[0]).toHaveProperty("word");
	});

	test("getWordsByStartingLetters - matches letters correctly", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce({
			items: [
				{ id: "1", word: "apple", question: "a fruit" },
				{ id: "2", word: "banana", question: "yellow" },
			],
			continueCursor: null,
		});

		const selected = await dictionaryService.getWordsByStartingLetters("ab");
		expect(selected).toHaveLength(2);
		expect(selected[0].word).toBe("apple");
		expect(selected[1].word).toBe("banana");
	});

	test("getWordsByStartingLetters - uses fallback for missing letters", async () => {
		vi.spyOn(convexService, "query").mockResolvedValueOnce({
			items: [],
			continueCursor: null,
		});

		const selected = await dictionaryService.getWordsByStartingLetters("z");
		expect(selected).toHaveLength(1);
		expect(selected[0].word).toBe("zword");
	});
});
