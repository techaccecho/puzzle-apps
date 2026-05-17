import { BaseApiService } from "../base-api-service.js";
import dictionaryService from "../word-search/dictionary-service.js";
import convexService from "../convex/convex-service.js";

class AdminService extends BaseApiService {
  constructor() {
    super();
  }

  async storeRedirectUrl(url: string, type = "default") {
    try {
      return await convexService.mutation("redirectUrls:store", { url, type });
    } catch (error) {
      console.error(`Error storing redirect URL for ${type}:`, error);
      throw error;
    }
  }

  async getRedirectUrl(type = "default") {
    try {
      return await convexService.query("redirectUrls:get", { type });
    } catch (error) {
      console.error(`Error retrieving redirect URL for ${type}:`, error);
      throw error;
    }
  }

  async listRedirectUrls() {
    try {
      return await convexService.query("redirectUrls:list");
    } catch (error) {
      console.error("Error listing redirect URLs:", error);
      throw error;
    }
  }

  async deleteRedirectUrl(type: string) {
    try {
      return await convexService.mutation("redirectUrls:delete", { type });
    } catch (error) {
      console.error(`Error deleting redirect URL for ${type}:`, error);
      throw error;
    }
  }

  async storeServiceMapping(serviceName: string, redirectUrlType: string) {
    try {
      // Validate that the redirectUrlType exists
      const redirectUrl = await convexService.query("redirectUrls:get", { type: redirectUrlType });
      if (!redirectUrl) {
        throw new Error(`Redirect URL type '${redirectUrlType}' does not exist.`);
      }

      return await convexService.mutation("serviceMappings:store", { serviceName, redirectUrlType });
    } catch (error) {
      console.error(`Error storing service mapping for ${serviceName}:`, error);
      throw error;
    }
  }

  async listServiceMappings() {
    try {
      return await convexService.query("serviceMappings:list");
    } catch (error) {
      console.error("Error listing service mappings:", error);
      throw error;
    }
  }

  async deleteServiceMapping(serviceName: string) {
    try {
      return await convexService.mutation("serviceMappings:delete", { serviceName });
    } catch (error) {
      console.error(`Error deleting service mapping for ${serviceName}:`, error);
      throw error;
    }
  }

  async getServiceMapping(serviceName: string) {
    try {
      return await convexService.query("serviceMappings:get", { serviceName });
    } catch (error) {
      console.error(`Error retrieving service mapping for ${serviceName}:`, error);
      throw error;
    }
  }
  
  async listPuzzles(filter?: string, cursor?: string, numItems?: number) {
    try {
      return await convexService.query("wordSearchPuzzles:list", { filter, cursor, numItems });
    } catch (error) {
      console.error("Error listing puzzles:", error);
      throw error;
    }
  }

  async listShortUrls() {
    try {
      return await convexService.query("shortUrls:list");
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
