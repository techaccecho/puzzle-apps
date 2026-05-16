import { ConvexHttpClient } from "convex/browser";
import { BaseApiService } from "../BaseApiService.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConvexService extends BaseApiService {
  private client: ConvexHttpClient | null = null;
  private mockPuzzles = new Map<string, any>();
  private mockRedirectUrls = new Map<string, { url: string }>();
  private redirectUrlCache = new Map<string, { url: string }>();
  private mockServiceMappings = new Map<string, { redirectUrlType: string }>();
  private mockShortUrls = new Map<string, any>();
  private mockDictionary = new Map<string, any>();

  constructor() {
    super();

    // Seed mock dictionary with values from config
    try {
      const dictionaryPath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "config",
        "dictionaryData.json"
      );
      if (fs.existsSync(dictionaryPath)) {
        const defaultWords = JSON.parse(fs.readFileSync(dictionaryPath, "utf8"));
        defaultWords.forEach((item: any) => {
          this.mockDictionary.set(item.id.toString(), item);
        });
      } else {
        console.warn("Dictionary seed file not found at " + dictionaryPath);
        const fallbackWords = [
          {
            id: "1",
            word: "express",
            question: "A fast web framework for Node.js",
          },
          { id: "2", word: "backend", question: "The server-side of an application" },
        ];
        fallbackWords.forEach((item) => {
          this.mockDictionary.set(item.id, item);
        });
      }
    } catch (error) {
      console.error("Error loading dictionary seed data:", error);
    }

    // Seed mock redirect URLs and service mappings from combined config
    try {
      const redirectUrlPath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "config",
        "redirectUrlData.json"
      );
      if (fs.existsSync(redirectUrlPath)) {
        const defaultUrls = JSON.parse(fs.readFileSync(redirectUrlPath, "utf8"));
        defaultUrls.forEach((item: any) => {
          this.mockRedirectUrls.set(item.type, { url: item.redirectUrl });
          if (item.serviceName) {
            this.mockServiceMappings.set(item.serviceName, { redirectUrlType: item.type });
          }
        });
      } else {
        console.warn("Redirect URL seed file not found at " + redirectUrlPath);
      }
    } catch (error) {
      console.error("Error loading redirect URL seed data:", error);
    }

    const convexUrl = process.env.CONVEX_URL;
    if (convexUrl) {
      this.client = new ConvexHttpClient(convexUrl);
    } else {
      console.warn("CONVEX_URL not set. ConvexService will operate in mock mode.");
      this.client = null;
    }
  }

  async query(name: string, args: any = {}): Promise<any> {
    if (!this.client) {
      console.log(`[MOCK] Convex Query: ${name}`, args);
      if (name === "urlShorter:getByCode" && args.shortCode) {
        return this.mockShortUrls.get(args.shortCode) || null;
      }
      if (name === "puzzle:wordsearch:getById") {
        const puzzle = this.mockPuzzles.get(args.puzzleId);
        if (puzzle && args.userId && puzzle.userId !== args.userId) {
          console.log(
            `[MOCK] getById: User mismatch. Puzzle user: ${puzzle.userId}, Args user: ${args.userId}`
          );
          return null;
        }
        return puzzle || null;
      }

      if (name === "puzzle:wordsearch:list") {
        let puzzles = Array.from(this.mockPuzzles.values());
        if (args.filter === "ACTIVE") {
          puzzles = puzzles.filter((p) => !p.completed);
        } else if (args.filter === "COMPLETE") {
          puzzles = puzzles.filter((p) => p.completed);
        }

        const numItems = parseInt(args.numItems) || 10;
        const startIndex = args.cursor ? parseInt(args.cursor) : 0;
        const paginatedItems = puzzles.slice(startIndex, startIndex + numItems);
        const nextIndex = startIndex + numItems;
        const continueCursor =
          nextIndex < puzzles.length ? nextIndex.toString() : null;

        return {
          items: paginatedItems,
          continueCursor: continueCursor,
        };
      }
      if (name === "puzzle:wordsearch:getByUserId") {
        const puzzles = Array.from(this.mockPuzzles.values());
        const activePuzzle = puzzles.find(
          (p) => p.userId === args.userId && !p.completed
        );
        return activePuzzle || null;
      }
      if (name === "urlShorter:getByUser") {
        const items = Array.from(this.mockShortUrls.values());
        return items.filter((item) => item.userId === args.userId);
      }
      if (name === "redirectUrl:get") {
        const type = args && args.type ? args.type : "default";
        
        // Check cache first
        if (this.redirectUrlCache.has(type)) {
          console.log(`[MOCK] redirectUrl:get - Cache hit for ${type}`);
          return this.redirectUrlCache.get(type);
        }

        const result = this.mockRedirectUrls.get(type) || null;
        
        if (result) {
          this.redirectUrlCache.set(type, result);
        }
        
        return result;
      }
      if (name === "redirectUrl:list") {
        return Array.from(this.mockRedirectUrls.entries()).map(([type, data]) => ({
          type,
          ...data,
        }));
      }
      if (name === "serviceMapping:get") {
        return this.mockServiceMappings.get(args.serviceName) || null;
      }
      if (name === "serviceMapping:list") {
        return Array.from(this.mockServiceMappings.entries()).map(([serviceName, data]) => ({
          serviceName,
          ...data,
        }));
      }
      if (name === "dictionary:get") {
        return this.mockDictionary.get(args.id) || null;
      }
      if (name === "dictionary:list") {
        const items = Array.from(this.mockDictionary.entries()).map(
          ([id, data]) => ({ id, ...data })
        );

        const numItems = parseInt(args.numItems) || 10;
        const startIndex = args.cursor ? parseInt(args.cursor) : 0;
        const paginatedItems = items.slice(startIndex, startIndex + numItems);
        const nextIndex = startIndex + numItems;
        const continueCursor =
          nextIndex < items.length ? nextIndex.toString() : null;

        return {
          items: paginatedItems,
          continueCursor: continueCursor,
        };
      }
    }
    try {
      return await this.client!.query(name as any, args);
    } catch (error) {
      console.error(`Convex Query Error [${name}]:`, error);
      throw error;
    }
  }

  async mutation(name: string, args: any): Promise<any> {
    if (!this.client) {
      console.log(`[MOCK] Convex Mutation: ${name}`, args);
      if (name === "puzzle:wordsearch:create") {
        this.mockPuzzles.set(args.id, args);
        return { success: true, id: args.id };
      }
      if (name === "urlShorter:create") {
        this.mockShortUrls.set(args.shortCode, args);
        return { success: true };
      }
      if (name === "puzzle:wordsearch:updateProgress") {
        if (!args.puzzleId || !args.userId || !args.word) {
          return { success: false, message: "Missing fields in mock" };
        }

        const puzzle = this.mockPuzzles.get(args.puzzleId);
        if (puzzle) {
          puzzle.foundWords = args.foundWords || puzzle.foundWords;
          if (args.allFound) {
            puzzle.completed = true;
          }
        }

        if (args.word.toLowerCase().includes("invalid")) {
          return { success: false, message: "Invalid word" };
        }
        if (args.userId.toLowerCase().includes("invalid")) {
          return { success: false, message: "Invalid user" };
        }
      }
      if (name === "redirectUrl:store" || name === "redirectUrl:update") {
        const type = args.type || "default";
        this.mockRedirectUrls.set(type, { url: args.url });
        this.redirectUrlCache.set(type, { url: args.url });
        return { success: true, data: { type, url: args.url } };
      }
      if (name === "dictionary:add") {
        const ids = Array.from(this.mockDictionary.keys())
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
        const nextId = (ids.length > 0 ? Math.max(...ids) + 1 : 1).toString();
        const data = { id: nextId, word: args.word, question: args.question };
        this.mockDictionary.set(nextId, data);
        return { success: true, ...data };
      }
      if (name === "dictionary:update") {
        const existing = this.mockDictionary.get(args.id);
        if (!existing) return { success: false, message: "Word not found" };
        const updated = {
          word: args.word !== undefined ? args.word : existing.word,
          question: args.question !== undefined ? args.question : existing.question,
        };
        this.mockDictionary.set(args.id, updated);
        return { success: true, id: args.id, ...updated };
      }
      if (name === "redirectUrl:delete") {
        const type = args.type || "default";
        this.mockRedirectUrls.delete(type);
        this.redirectUrlCache.delete(type);
        return { success: true };
      }
      if (name === "serviceMapping:store") {
        this.mockServiceMappings.set(args.serviceName, { redirectUrlType: args.redirectUrlType });
        return { success: true, data: { serviceName: args.serviceName, redirectUrlType: args.redirectUrlType } };
      }
      if (name === "serviceMapping:delete") {
        this.mockServiceMappings.delete(args.serviceName);
        return { success: true };
      }
      return { success: true, mocked: true };
    }
    try {
      return await this.client!.mutation(name as any, args);
    } catch (error) {
      console.error(`Convex Mutation Error [${name}]:`, error);
      throw error;
    }
  }
}

export default new ConvexService();
