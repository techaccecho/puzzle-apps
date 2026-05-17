import { FastifyInstance, FastifyPluginOptions, FastifySchema } from "fastify";
import wordSearchService from "../services/word-search/word-search-service.js";
import urlShortenerService from "../services/url-shortner/url-shortener-service.js";
import dictionaryService from "../services/word-search/dictionary-service.js";
import adminService from "../services/admin-portal/admin-service.js";

const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
};

export default async function apiRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Wordsearch endpoints
  fastify.get(
    "/puzzle/wordSearch",
    {
      schema: {
        description: "Generate a new puzzle",
        tags: ["puzzle"],
        querystring: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponse,
          404: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Validate a found word using coordinates",
        tags: ["puzzle"],
        body: {
          type: "object",
          required: ["puzzleId", "word", "userId"],
          properties: {
            puzzleId: { type: "string" },
            word: { type: "string" },
            userId: { type: "string" },
            cells: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponse,
          404: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Retrieve the final short URL after solving the puzzle",
        tags: ["puzzle"],
        body: {
          type: "object",
          required: ["puzzleId", "userId"],
          properties: {
            puzzleId: { type: "string" },
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  shortUrl: { type: "string" },
                },
              },
            },
          },
          400: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Get all puzzles with filter and pagination",
        tags: ["puzzle"],
        querystring: {
          type: "object",
          properties: {
            filter: { type: "string", enum: ["ALL", "ACTIVE", "COMPLETE"] },
            numItems: { type: "integer", default: 10 },
            cursor: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  items: { type: "array", items: { type: "object", additionalProperties: true } },
                  continueCursor: { type: "string", nullable: true },
                },
              },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Add a new word-question pair (Admin)",
        tags: ["admin"],
        body: {
          type: "object",
          required: ["word", "question"],
          properties: {
            word: { type: "string" },
            question: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Update an existing dictionary entry (Admin)",
        tags: ["admin"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            word: { type: "string" },
            question: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Store a redirect URL with a specific type",
        tags: ["admin"],
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string", format: "uri" },
            type: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Delete a redirect URL by type",
        tags: ["admin"],
        params: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "List all redirect URLs",
        tags: ["admin"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "List all service mappings",
        tags: ["admin"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "List all puzzles",
        tags: ["admin"],
        querystring: {
          type: "object",
          properties: {
            filter: { type: "string" },
            cursor: { type: "string" },
            numItems: { type: "number" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  items: { type: "array", items: { type: "object", additionalProperties: true } },
                  continueCursor: { type: "string", nullable: true },
                },
              },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "List all short URLs",
        tags: ["admin"],
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Store a service mapping",
        tags: ["admin"],
        body: {
          type: "object",
          required: ["serviceName", "redirectUrlType"],
          properties: {
            serviceName: { type: "string" },
            redirectUrlType: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Delete a service mapping",
        tags: ["admin"],
        params: {
          type: "object",
          required: ["serviceName"],
          properties: {
            serviceName: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Update a redirect URL",
        tags: ["admin"],
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string", format: "uri" },
            type: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Resolve short code and redirect",
        tags: ["shortUrl"],
        params: {
          type: "object",
          properties: {
            shortCode: { type: "string" },
          },
        },
        response: {
          302: { type: "null", description: "Redirect to target URL" },
          404: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Get short URL info",
        tags: ["shortUrl"],
        params: {
          type: "object",
          properties: {
            shortCode: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Get short URLs by user ID",
        tags: ["shortUrl"],
        params: {
          type: "object",
          properties: {
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "List dictionary entries with pagination",
        tags: ["dictionary"],
        querystring: {
          type: "object",
          properties: {
            numItems: { type: "string" },
            cursor: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Get a dictionary entry by ID",
        tags: ["dictionary"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Add a new word-question pair",
        tags: ["dictionary"],
        body: {
          type: "object",
          required: ["word", "question"],
          properties: {
            word: { type: "string" },
            question: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          400: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
      schema: {
        description: "Update an existing dictionary entry",
        tags: ["dictionary"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            word: { type: "string" },
            question: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object", additionalProperties: true },
            },
          },
          404: errorResponse,
          500: errorResponse,
        },
      } as FastifySchema,
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
