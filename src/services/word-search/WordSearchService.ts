import { BaseApiService } from "../BaseApiService.js";
import convexService from "../convex/ConvexService.js";
import urlShortenerService from "../url-shortner/UrlShortenerService.js";
import dictionaryService from "./DictionaryService.js";

interface Clue {
  word: string;
  question: string;
}

interface FoundWord {
  word: string;
  cells: { x: number; y: number }[];
}

interface PuzzleData {
  id: string;
  clues: Clue[];
  userId: string;
  shortUrl: string;
  grid: string[][];
  foundWords: (string | FoundWord)[];
  completed: boolean;
}

class WordSearchService extends BaseApiService {
  private puzzleCache = new Map<string, PuzzleData>();

  constructor() {
    super();
  }

  async generatePuzzle(userId: string) {
    let puzzleData: PuzzleData | null = null;
    const existingPuzzle = await convexService.query(
      "wordSearchPuzzles:getByUserId",
      { userId }
    );

    if (existingPuzzle) {
      console.log(`Using existing puzzle for user ${userId}: ${existingPuzzle.id}`);
      puzzleData = existingPuzzle;
      this.puzzleCache.set(puzzleData!.id, puzzleData!);
    } else {
      const mapping = await convexService.query("serviceMappings:get", { serviceName: "word-search" });
      const redirectType = mapping?.redirectUrlType || "puzzle-wordsearch";
      
      const shortUrl = await urlShortenerService.generateShortUrl(null, userId, redirectType);
      const dictionaryEntries = await dictionaryService.getWordsByStartingLetters(
        shortUrl
      );
      const selectedWords = dictionaryEntries.map((entry: any) => entry.word);
      const clues = dictionaryEntries.map((entry: any) => ({
        word: entry.word,
        question: entry.question,
      }));

      const { grid, size } = this._createGrid(selectedWords);

      puzzleData = {
        id: `puzzle_${Date.now()}`,
        clues: clues,
        userId: userId,
        shortUrl: shortUrl,
        grid: grid,
        foundWords: [],
        completed: false,
      };

      this.puzzleCache.set(puzzleData.id, puzzleData);

      try {
        await convexService.mutation("wordSearchPuzzles:create", puzzleData);
      } catch (e) {
        console.error("Failed to store puzzle in Convex", e);
      }
    }

    const responseData = {
      id: puzzleData!.id,
      clues: puzzleData!.clues.map((c) => ({
        question: c.question,
        length: c.word.length,
        id: Buffer.from(c.word.toLowerCase())
          .toString("base64")
          .replace(/=/g, ""),
      })),
      userId: puzzleData!.userId,
      grid: puzzleData!.grid,
      size: puzzleData!.grid.length,
      foundWords: puzzleData!.foundWords.map((w) => {
        const wordString = typeof w === "string" ? w : w.word;
        return {
          id: Buffer.from(wordString.toLowerCase())
            .toString("base64")
            .replace(/=/g, ""),
          firstLetter: wordString[0].toUpperCase(),
          cells: typeof w === "string" ? [] : w.cells,
        };
      }),
    };

    return responseData;
  }
  
  async listPuzzles(filter: string = "ALL", numItems: number = 10, cursor?: string) {
    try {
      const result = await convexService.query("wordSearchPuzzles:list", {
        filter,
        numItems,
        cursor,
      });
      return result;
    } catch (error) {
      console.error("Error listing puzzles:", error);
      throw error;
    }
  }

  private _createGrid(words: string[]) {
    const size = Math.max(
      Math.ceil(Math.sqrt(words.reduce((s, w) => s + w.length, 0) * 1.5)),
      Math.max(...words.map((w) => w.length)) + 2,
      12
    );

    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 0],
      [0, -1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];

    let grid: string[][] | undefined;
    let allPlaced = false;
    let gridAttempts = 0;

    while (!allPlaced && gridAttempts < 50) {
      grid = Array.from({ length: size }, () => Array(size).fill(""));
      allPlaced = true;
      const sortedWords = [...words].sort((a, b) => b.length - a.length);

      for (const word of sortedWords) {
        let placed = false;
        let wordAttempts = 0;
        while (!placed && wordAttempts < 200) {
          const dir =
            directions[Math.floor(Math.random() * directions.length)];
          const dx = dir[0];
          const dy = dir[1];
          const x = Math.floor(Math.random() * size);
          const y = Math.floor(Math.random() * size);

          if (this._canPlace(grid, size, word, x, y, dx, dy)) {
            for (let i = 0; i < word.length; i++) {
              grid[y + i * dy][x + i * dx] = word[i].toLowerCase();
            }
            placed = true;
          }
          wordAttempts++;
        }

        if (!placed) {
          allPlaced = false;
          break;
        }
      }
      gridAttempts++;
    }

    const letters = "abcdefghijklmnopqrstuvwxyz";
    if (grid) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!grid[y][x]) {
            grid[y][x] = letters[Math.floor(Math.random() * 26)];
          }
        }
      }
    } else {
      grid = Array.from({ length: size }, () =>
        Array.from({ length: size }, () =>
          letters[Math.floor(Math.random() * 26)]
        )
      );
    }

    return { grid, size };
  }

  private _canPlace(
    grid: string[][],
    size: number,
    word: string,
    x: number,
    y: number,
    dx: number,
    dy: number
  ) {
    for (let i = 0; i < word.length; i++) {
      let nx = x + i * dx;
      let ny = y + i * dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) return false;
      if (grid[ny][nx] && grid[ny][nx] !== word[i].toLowerCase()) return false;
    }
    return true;
  }

  async validateWord(
    puzzleId: string,
    word: string,
    userId: string,
    cells: { x: number; y: number }[] = []
  ) {
    try {
      let puzzle = this.puzzleCache.get(puzzleId);

      if (!puzzle) {
        puzzle = await convexService.query("wordSearchPuzzles:getById", {
          puzzleId,
          userId,
        });

        if (puzzle) {
          puzzle!.foundWords = puzzle!.foundWords || [];
          this.puzzleCache.set(puzzleId, puzzle!);
        }
      }

      if (!puzzle) {
        return { success: false, message: "Puzzle not found" };
      }

      if (puzzle.userId !== userId) {
        console.log(
          `Access denied for puzzle ${puzzleId}. Puzzle user: ${puzzle.userId}, Request user: ${userId}`
        );
        return { success: false, message: "Access denied" };
      }

      const normalizedWord = word.toLowerCase();
      const reversedWord = normalizedWord.split("").reverse().join("");
      const strippedWord = normalizedWord.replace(/[^a-z0-9]/g, "");
      const strippedReversed = reversedWord.replace(/[^a-z0-9]/g, "");

      const matchForward = puzzle.clues.find((c) => {
        const nw = c.word.toLowerCase();
        return (
          nw === normalizedWord || nw.replace(/[^a-z0-9]/g, "") === strippedWord
        );
      });

      const matchReverse = !matchForward
        ? puzzle.clues.find((c) => {
            const nw = c.word.toLowerCase();
            return (
              nw === reversedWord ||
              nw.replace(/[^a-z0-9]/g, "") === strippedReversed
            );
          })
        : null;

      if (!matchForward && !matchReverse) {
        return { success: false, message: "Invalid word for this puzzle" };
      }

      const actualWord = (matchForward || matchReverse)!.word.toLowerCase();
      const usedCells = matchForward ? cells : cells.slice().reverse();

      const alreadyFound = puzzle.foundWords.some(
        (w) => (typeof w === "string" ? w : w.word) === actualWord
      );

      if (!alreadyFound) {
        puzzle.foundWords.push({
          word: actualWord,
          cells: usedCells,
        });
      } else {
        const existingEntry = puzzle.foundWords.find(
          (w) => (typeof w === "string" ? w : w.word) === actualWord
        );
        if (
          typeof existingEntry === "object" &&
          (!existingEntry.cells || existingEntry.cells.length === 0)
        ) {
          existingEntry.cells = usedCells;
        }
      }

      const allFound = puzzle.clues.every((c) =>
        puzzle!.foundWords.some(
          (fw) => (typeof fw === "string" ? fw : fw.word) === c.word.toLowerCase()
        )
      );

      if (allFound) {
        try {
          await convexService.mutation("wordSearchPuzzles:updateProgress", {
            puzzleId,
            word: actualWord,
            userId,
            allFound: true,
            foundWords: puzzle.foundWords,
          });
        } catch (dbError) {
          console.error("Failed to sync completion to DB", dbError);
        }
      }

      return {
        success: true,
        word: actualWord,
        cells: usedCells,
      };
    } catch (e) {
      console.error("Failed to validate word", e);
      return { success: false, message: "Validation service error" };
    }
  }

  async getPuzzleCompletionData(puzzleId: string, userId: string) {
    try {
      let puzzle = this.puzzleCache.get(puzzleId);

      if (!puzzle) {
        puzzle = await convexService.query("wordSearchPuzzles:getById", {
          puzzleId,
          userId,
        });
      }

      if (!puzzle) return null;

      if (puzzle.userId !== userId) {
        console.log(
          `Access denied for puzzle completion ${puzzleId}. Puzzle user: ${puzzle.userId}, Request user: ${userId}`
        );
        return null;
      }

      return {
        shortUrl: puzzle.shortUrl,
      };
    } catch (e) {
      console.error("Failed to get puzzle completion data", e);
      return null;
    }
  }
}

export default new WordSearchService();
