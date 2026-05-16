import { BaseApiService } from "../BaseApiService.js";
import convexService from "../convex/ConvexService.js";

class DictionaryService extends BaseApiService {
  constructor() {
    super();
  }

  async addWord(word: string, question: string) {
    try {
      return await convexService.mutation("dictionary:add", { word, question });
    } catch (error) {
      console.error("Error adding word to dictionary:", error);
      throw error;
    }
  }

  async updateWord(id: string, word?: string, question?: string) {
    try {
      return await convexService.mutation("dictionary:update", {
        id,
        word,
        question,
      });
    } catch (error) {
      console.error("Error updating dictionary word:", error);
      throw error;
    }
  }

  async getWord(id: string) {
    try {
      return await convexService.query("dictionary:get", { id });
    } catch (error) {
      console.error("Error fetching dictionary word:", error);
      throw error;
    }
  }

  async getAllWords(pagination = { cursor: null as string | null, numItems: 10 }) {
    try {
      return await convexService.query("dictionary:list", pagination);
    } catch (error) {
      console.error("Error fetching dictionary list:", error);
      throw error;
    }
  }

  async getRandomWords(count: number) {
    try {
      const result = await convexService.query("dictionary:list", {
        numItems: 500,
      });
      const words = result.items || [];

      if (words.length === 0) {
        return [
          {
            word: "apple",
            question: "Newton's inspiration that fell from grace",
          },
          { word: "backend", question: "The server-side of an application" },
          { word: "convex", question: "A reactive database for web apps" },
          {
            word: "dream",
            question:
              "A series of thoughts, images, and sensations occurring in a person's mind during sleep",
          },
          {
            word: "echo",
            question: "I speak without a mouth and hear without ears",
          },
          {
            word: "forest",
            question: "A large area covered chiefly with trees and undergrowth",
          },
          {
            word: "galaxy",
            question:
              "A system of millions or billions of stars, together with gas and dust, held together by gravitational attraction",
          },
        ].slice(0, count);
      }

      const shuffled = [...words].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      console.error("Error getting random words from dictionary:", error);
      return [];
    }
  }

  async getWordsByStartingLetters(letters: string) {
    try {
      const result = await convexService.query("dictionary:list", {
        numItems: 500,
      });
      const allWords = result.items || [];

      const selected = [];
      for (const char of letters) {
        const charLower = char.toLowerCase();
        const candidates = allWords.filter(
          (w: any) => w.word[0].toLowerCase() === charLower
        );

        if (candidates.length > 0) {
          const picked =
            candidates[Math.floor(Math.random() * candidates.length)];
          selected.push(picked);
        } else {
          // Fallback if no word starts with that letter
          selected.push({
            word: charLower + "word",
            question: `A word starting with ${charLower.toUpperCase()}`,
          });
        }
      }
      return selected;
    } catch (error) {
      console.error("Error getting words by starting letters:", error);
      throw error;
    }
  }
}

export default new DictionaryService();
