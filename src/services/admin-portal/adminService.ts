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

  async deleteRedirectUrl(type: string) {
    try {
      return await convexService.mutation("redirectUrl:delete", { type });
    } catch (error) {
      console.error(`Error deleting redirect URL for ${type}:`, error);
      throw error;
    }
  }

  async storeServiceMapping(serviceName: string, redirectUrlType: string) {
    try {
      // Validate that the redirectUrlType exists
      const redirectUrl = await convexService.query("redirectUrl:get", { type: redirectUrlType });
      if (!redirectUrl) {
        throw new Error(`Redirect URL type '${redirectUrlType}' does not exist.`);
      }

      return await convexService.mutation("serviceMapping:store", { serviceName, redirectUrlType });
    } catch (error) {
      console.error(`Error storing service mapping for ${serviceName}:`, error);
      throw error;
    }
  }

  async listServiceMappings() {
    try {
      return await convexService.query("serviceMapping:list");
    } catch (error) {
      console.error("Error listing service mappings:", error);
      throw error;
    }
  }

  async deleteServiceMapping(serviceName: string) {
    try {
      return await convexService.mutation("serviceMapping:delete", { serviceName });
    } catch (error) {
      console.error(`Error deleting service mapping for ${serviceName}:`, error);
      throw error;
    }
  }

  async getServiceMapping(serviceName: string) {
    try {
      return await convexService.query("serviceMapping:get", { serviceName });
    } catch (error) {
      console.error(`Error retrieving service mapping for ${serviceName}:`, error);
      throw error;
    }
  }
  
  async listPuzzles(filter?: string, cursor?: string, numItems?: number) {
    try {
      return await convexService.query("puzzle:wordsearch:list", { filter, cursor, numItems });
    } catch (error) {
      console.error("Error listing puzzles:", error);
      throw error;
    }
  }

  async listShortUrls() {
    try {
      return await convexService.query("urlShorter:list");
    } catch (error) {
      console.error("Error listing short URLs:", error);
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
