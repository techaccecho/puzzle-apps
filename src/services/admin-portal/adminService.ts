import { BaseApiService } from "../BaseApiService.js";
import dictionaryService from "../word-search/DictionaryService.js";
import convexService from "../convex/ConvexService.js";

class AdminService extends BaseApiService {
  constructor() {
    super();
  }

  async storeRedirectUrl(url: string, type = "default") {
    try {
      return await convexService.mutation("redirectUrl:store", { url, type });
    } catch (error) {
      console.error(`Error storing redirect URL for ${type}:`, error);
      throw error;
    }
  }

  async getRedirectUrl(type = "default") {
    try {
      return await convexService.query("redirectUrl:get", { type });
    } catch (error) {
      console.error(`Error retrieving redirect URL for ${type}:`, error);
      throw error;
    }
  }

  async listRedirectUrls() {
    try {
      return await convexService.query("redirectUrl:list");
    } catch (error) {
      console.error("Error listing redirect URLs:", error);
      throw error;
    }
  }

  async addDictionaryWord(word: string, question: string) {
    return dictionaryService.addWord(word, question);
  }

  async updateDictionaryWord(id: string, word?: string, question?: string) {
    return dictionaryService.updateWord(id, word, question);
  }
}

export default new AdminService();
