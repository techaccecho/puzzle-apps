import { FastifyInstance, FastifyPluginOptions } from "fastify";
import wordSearchService from "../services/word-search/word-search-service.js";
import urlShortenerService from "../services/url-shortner/url-shortener-service.js";
import dictionaryService from "../services/word-search/dictionary-service.js";
import adminService from "../services/admin-portal/admin-service.js";
import * as schemas from "../schemas/api-schemas.js";

export default async function apiRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Wordsearch endpoints
  fastify.get(
    "/puzzle/wordSearch",
    {
      schema: schemas.wordSearchGenerateSchema,
    },
    async (request, reply) => {
    try {
      const { userId } = request.query as { userId: string };
      const puzzle = await wordSearchService.generatePuzzle(userId);
      return { success: true, data: puzzle };
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  });

  fastify.post(
    "/puzzle/wordSearch/validate",
    {
      schema: schemas.wordSearchValidateSchema,
    },
    async (request, reply) => {
    try {
      const { puzzleId, word, userId, cells } = request.body as {
        puzzleId: string;
        word: string;
        userId: string;
        cells?: { x: number; y: number }[];
      };

      if (!puzzleId || !word || !userId) {
        reply.status(400).send({
          success: false,
          message: "Missing required fields: puzzleId, word, or userId",
        });
        return;
      }

      const result = await wordSearchService.validateWord(
        puzzleId,
        word,
        userId,
        cells
      );

      if (!result || result.success === false) {
        const status =
          result &&
          (result.message === "Puzzle not found" ||
            result.message === "Access denied")
            ? 404
            : 400;
        reply.status(status).send({
          success: false,
          message: result
            ? result.message
            : "Invalid word or user for this puzzle",
        });
        return;
      }

      return { success: true, data: result };
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  });

  fastify.post(
    "/puzzle/wordSearch/complete",
    {
      schema: schemas.wordSearchCompleteSchema,
    },
    async (request, reply) => {
    try {
      const { puzzleId, userId } = request.body as {
        puzzleId: string;
        userId: string;
      };
      if (!puzzleId || !userId) {
        reply
          .status(400)
          .send({ success: false, message: "Missing puzzleId or userId" });
        return;
      }

      const puzzle = await wordSearchService.getPuzzleCompletionData(
        puzzleId,
        userId
      );

      if (!puzzle) {
        reply.status(400).send({
          success: false,
          message: "Puzzle not found or not eligible",
        });
        return;
      }

      return {
        success: true,
        data: {
          shortUrl: puzzle.shortUrl,
        },
      };
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  });

  fastify.get(
    "/puzzle/wordsearch/list",
    {
      schema: schemas.wordSearchListSchema,
    },
    async (request, reply) => {
      try {
        const { filter, numItems, cursor } = request.query as {
          filter?: string;
          numItems?: number;
          cursor?: string;
        };
        const result = await wordSearchService.listPuzzles(
          filter || "ALL",
          numItems,
          cursor
        );
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // Admin endpoints
  fastify.post(
    "/admin/dictionary",
    {
      schema: schemas.adminDictionaryAddSchema,
    },
    async (request, reply) => {
      try {
        const { word, question } = request.body as {
          word: string;
          question: string;
        };
        const result = await adminService.addDictionaryWord(word, question);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.patch(
    "/admin/dictionary/:id",
    {
      schema: schemas.adminDictionaryUpdateSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { word, question } = request.body as {
          word?: string;
          question?: string;
        };
        const result = await adminService.updateDictionaryWord(id, word, question);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.post(
    "/admin/redirectUrl",
    {
      schema: schemas.adminRedirectUrlStoreSchema,
    },
    async (request, reply) => {
      try {
        const { url, type } = request.body as { url: string; type?: string };
        if (!url) {
          reply.status(400).send({ success: false, message: "URL is required" });
          return;
        }
        const result = await adminService.storeRedirectUrl(url, type);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.delete(
    "/admin/redirectUrl/:type",
    {
      schema: schemas.adminRedirectUrlDeleteSchema,
    },
    async (request, reply) => {
      try {
        const { type } = request.params as { type: string };
        const result = await adminService.deleteRedirectUrl(type);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.get(
    "/admin/redirectUrl",
    {
      schema: schemas.adminRedirectUrlListSchema,
    },
    async (request, reply) => {
      try {
        const result = await adminService.listRedirectUrls();
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.get(
    "/admin/serviceMapping",
    {
      schema: schemas.adminServiceMappingListSchema,
    },
    async (request, reply) => {
      try {
        const result = await adminService.listServiceMappings();
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.get(
    "/admin/puzzles",
    {
      schema: schemas.adminPuzzlesListSchema,
    },
    async (request, reply) => {
      try {
        const { filter, cursor, numItems } = request.query as any;
        const result = await adminService.listPuzzles(filter, cursor, numItems);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.get(
    "/admin/shortUrls",
    {
      schema: schemas.adminShortUrlsListSchema,
    },
    async (request, reply) => {
      try {
        const result = await adminService.listShortUrls();
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.post(
    "/admin/serviceMapping",
    {
      schema: schemas.adminServiceMappingStoreSchema,
    },
    async (request, reply) => {
      try {
        const { serviceName, redirectUrlType } = request.body as {
          serviceName: string;
          redirectUrlType: string;
        };
        const result = await adminService.storeServiceMapping(
          serviceName,
          redirectUrlType
        );
        return { success: true, data: result };
      } catch (error: any) {
        if (error.message.includes("does not exist")) {
          reply.status(400).send({ success: false, message: error.message });
          return;
        }
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.delete(
    "/admin/serviceMapping/:serviceName",
    {
      schema: schemas.adminServiceMappingDeleteSchema,
    },
    async (request, reply) => {
      try {
        const { serviceName } = request.params as { serviceName: string };
        const result = await adminService.deleteServiceMapping(serviceName);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.patch(
    "/admin/redirectUrl",
    {
      schema: schemas.adminRedirectUrlUpdateSchema,
    },
    async (request, reply) => {
      try {
        const { url, type } = request.body as { url: string; type?: string };
        if (!url) {
          reply.status(400).send({ success: false, message: "URL is required" });
          return;
        }
        const result = await adminService.storeRedirectUrl(url, type);
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // URL Shortener endpoints
  fastify.get(
    "/shortUrl/:shortCode",
    {
      schema: schemas.shortUrlResolveSchema,
    },
    async (request, reply) => {
      try {
        const { shortCode } = request.params as { shortCode: string };
        const redirectUrl = await urlShortenerService.getRedirectUrlByCode(
          shortCode
        );
        if (redirectUrl) {
          reply.redirect(redirectUrl);
        } else {
          reply.status(404).send({
            success: false,
            message: "Short URL not found or expired",
          });
        }
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.get(
    "/shortUrl/info/:shortCode",
    {
      schema: schemas.shortUrlInfoSchema,
    },
    async (request, reply) => {
      try {
        const { shortCode } = request.params as { shortCode: string };
        const info = await urlShortenerService.getShortUrlInfo(shortCode);
        if (info) {
          return { success: true, data: info };
        }
        reply.status(404).send({ success: false, message: "Short URL not found" });
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.get(
    "/shortUrl/user/:userId",
    {
      schema: schemas.shortUrlUserSchema,
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const urls = await urlShortenerService.getShortUrlsByUser(userId);
        return { success: true, data: urls };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // Dictionary endpoints
  fastify.get(
    "/dictionary",
    {
      schema: schemas.dictionaryListSchema,
    },
    async (request, reply) => {
    try {
      const { numItems, cursor } = request.query as {
        numItems?: string;
        cursor?: string;
      };
      const result = await dictionaryService.getAllWords({
        numItems: parseInt(numItems || "10") || 10,
        cursor: cursor || null,
      });
      return { success: true, data: result };
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  });

  fastify.get(
    "/dictionary/:id",
    {
      schema: schemas.dictionaryGetSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await dictionaryService.getWord(id);
        if (!result) {
          reply
            .status(404)
            .send({ success: false, message: "Dictionary entry not found" });
          return;
        }
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.post(
    "/dictionary",
    {
      schema: schemas.dictionaryAddSchema,
    },
    async (request, reply) => {
      try {
        const { word, question } = request.body as {
          word: string;
          question: string;
        };
        if (!word || !question) {
          reply
            .status(400)
            .send({ success: false, message: "Word and question are required" });
          return;
        }
        const result = await dictionaryService.addWord(word, question);
        reply.status(201).send({ success: true, data: result });
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  fastify.patch(
    "/dictionary/:id",
    {
      schema: schemas.dictionaryUpdateSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { word, question } = request.body as {
          word?: string;
          question?: string;
        };
        const result = await dictionaryService.updateWord(id, word, question);
        if (result && result.success === false) {
          reply.status(404).send({ success: false, message: result.message });
          return;
        }
        return { success: true, data: result };
      } catch (error: any) {
        reply.status(500).send({ success: false, message: error.message });
      }
    }
  );
}
