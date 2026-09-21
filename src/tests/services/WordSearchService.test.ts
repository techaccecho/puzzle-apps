import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import convexService from "../../services/convex/ConvexService.js";
import wordSearchService from "../../services/word-search/WordSearchService.js";

describe("WordSearchService", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		wordSearchService.clearCache();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({}),
			}),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	describe("generatePuzzle", () => {
		test("creates a new puzzle if none exists for user", async () => {
			const mockDb = new Map<string, any>();
			vi.spyOn(convexService, "query").mockImplementation(
				async (name, args: any) => {
					if (name === "puzzle:wordsearch:getByUserId") {
						return mockDb.get(args.userId) || null;
					}
					if (name === "serviceMapping:get") {
						return { redirectUrlType: "puzzle-wordsearch" };
					}
					if (name === "redirectUrl:get") {
						return { url: "http://example.com" };
					}
					if (name === "urlShorter:getByCode") {
						return null;
					}
					if (name === "dictionary:list") {
						return {
							items: [
								{ word: "apple", question: "q1" },
								{ word: "banana", question: "q2" },
								{ word: "cherry", question: "q3" },
								{ word: "date", question: "q4" },
								{ word: "elderberry", question: "q5" },
								{ word: "fig", question: "q6" },
								{ word: "grape", question: "q7" },
							],
						};
					}
					return null;
				},
			);
			vi.spyOn(convexService, "mutation").mockImplementation(
				async (name, args: any) => {
					if (name === "puzzle:wordsearch:create") {
						mockDb.set(args.userId, args);
						return args;
					}
					if (name === "urlShorter:create") {
						return args;
					}
					return { success: true };
				},
			);

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
				shortUrl: "testurl",
			};
			vi.spyOn(convexService, "query").mockImplementation(
				async (name, args: any) => {
					if (
						name === "puzzle:wordsearch:getByUserId" &&
						args.userId === "u1"
					) {
						return existing;
					}
					return null;
				},
			);

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
			foundWords: [] as any[],
			completed: false,
			shortUrl: "testurl",
		};

		let dbPuzzle: any;

		beforeEach(() => {
			dbPuzzle = JSON.parse(JSON.stringify(puzzle));
			(wordSearchService as any).puzzleCache.set(puzzleId, dbPuzzle);
			(wordSearchService as any).userPuzzleCache.set(userId, dbPuzzle);

			vi.spyOn(convexService, "query").mockImplementation(
				async (name, args: any) => {
					if (
						name === "puzzle:wordsearch:getById" &&
						args.puzzleId === puzzleId
					) {
						return dbPuzzle;
					}
					return null;
				},
			);

			vi.spyOn(convexService, "mutation").mockImplementation(
				async (name, args: any) => {
					if (name === "puzzle:wordsearch:updateProgress") {
						dbPuzzle.foundWords = args.foundWords;
						if (args.allFound) {
							dbPuzzle.completed = true;
						}
						return dbPuzzle;
					}
					return { success: true };
				},
			);
		});

		test("validates a correct word forward", async () => {
			const cells = "backend".split("").map((_, i) => ({ x: i, y: 0 }));
			const result = await wordSearchService.validateWord(
				puzzleId,
				"backend",
				userId,
				cells,
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
				cells,
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
				[],
			);
			expect(result.success).toBe(false);
		});

		test("denies access if userId mismatch", async () => {
			const result = await wordSearchService.validateWord(
				puzzleId,
				"backend",
				"wrongUser",
				[],
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
				[],
			);

			expect(result.success).toBe(true);
			const cached = (wordSearchService as any).puzzleCache.get(puzzleId);
			expect(cached.foundWords).toHaveLength(2);
			expect(dbPuzzle.completed).toBe(true);
		});

		test("returns false if puzzle missing in cache and DB", async () => {
			wordSearchService.clearCache();
			vi.spyOn(convexService, "query").mockResolvedValue(null);

			const result = await wordSearchService.validateWord(
				"missing",
				"word",
				"user",
				[],
			);
			expect(result.success).toBe(false);
			expect(result.message).toBe("Puzzle not found");
		});

		test("updates cells if existing entry has no cells", async () => {
			const puzzleWithNoCells = {
				id: "pNoCells",
				userId: "u1",
				words: ["apple"],
				foundWords: [{ word: "apple" }],
				completed: false,
				shortUrl: "testurl",
			};
			(wordSearchService as any).puzzleCache.set("pNoCells", puzzleWithNoCells);

			const cells = [{ x: 0, y: 0 }];
			const result = await wordSearchService.validateWord(
				"pNoCells",
				"apple",
				"u1",
				cells,
			);

			expect(result.success).toBe(true);
			const entry = puzzleWithNoCells.foundWords.find(
				(fw: any) => fw.word === "apple",
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
			(wordSearchService as any).puzzleCache.set(puzzleId, puzzle);

			const result = await wordSearchService.getPuzzleCompletionData(
				puzzleId,
				userId,
			);
			expect(result!.shortUrl).toBe("abc");
		});
	});

	describe("isPuzzleCompletedForUser", () => {
		test("returns false when user has no puzzle", async () => {
			vi.spyOn(convexService, "query").mockResolvedValue(null);
			const isCompleted =
				await wordSearchService.isPuzzleCompletedForUser("unknown-user");
			expect(isCompleted).toBe(false);
		});

		test("returns false when user puzzle is not completed", async () => {
			const puzzleId = "p_in_progress";
			const userId = "u_progress";
			const puzzle = {
				id: puzzleId,
				userId,
				words: ["apple"],
				foundWords: [],
				completed: false,
			};
			(wordSearchService as any).userPuzzleCache.set(userId, puzzle);

			const isCompleted =
				await wordSearchService.isPuzzleCompletedForUser(userId);
			expect(isCompleted).toBe(false);
		});

		test("returns true when user puzzle is completed in cache or DB", async () => {
			const puzzleId = "p_done";
			const userId = "u_done";
			const puzzle = {
				id: puzzleId,
				userId,
				words: ["apple"],
				foundWords: ["apple"],
				completed: true,
			};
			(wordSearchService as any).userPuzzleCache.set(userId, puzzle);

			const isCompleted =
				await wordSearchService.isPuzzleCompletedForUser(userId);
			expect(isCompleted).toBe(true);
		});
	});

	describe("resetPuzzleForUser", () => {
		test("clears cached puzzle and calls mutation", async () => {
			const mutationSpy = vi
				.spyOn(convexService, "mutation")
				.mockResolvedValue({ success: true } as any);
			const p = {
				id: "p_reset",
				userId: "u_reset",
				words: ["apple"],
				foundWords: [],
				completed: false,
				shortUrl: "s",
			};
			(wordSearchService as any).puzzleCache.set("p_reset", p);
			(wordSearchService as any).userPuzzleCache.set("u_reset", p);

			await wordSearchService.resetPuzzleForUser("u_reset");

			expect((wordSearchService as any).userPuzzleCache.has("u_reset")).toBe(
				false,
			);
			expect((wordSearchService as any).puzzleCache.has("p_reset")).toBe(false);
			expect(mutationSpy).toHaveBeenCalledWith("puzzle:wordsearch:reset", {
				userId: "u_reset",
			});
		});
	});
});
