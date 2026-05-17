export const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
  },
};

export const wordSearchGenerateSchema = {
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
        data: {
          type: "object",
          properties: {
            id: { type: "string" },
            clues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  length: { type: "number" },
                  id: { type: "string" },
                },
                required: ["question", "length", "id"],
              },
            },
            userId: { type: "string" },
            grid: {
              type: "array",
              items: {
                type: "array",
                items: { type: "string" },
              },
            },
            size: { type: "number" },
            foundWords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  firstLetter: { type: "string" },
                  cells: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                      },
                      required: ["x", "y"],
                    },
                  },
                },
                required: ["id", "firstLetter", "cells"],
              },
            },
          },
          required: ["id", "clues", "userId", "grid", "size", "foundWords"],
        },
      },
      required: ["success", "data"],
    },
    400: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const wordSearchValidateSchema = {
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
          required: ["x", "y"],
        },
      },
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
            success: { type: "boolean" },
            message: { type: "string" },
            word: { type: "string" },
            cells: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                },
                required: ["x", "y"],
              },
            },
            puzzleCompleted: { type: "boolean" },
          },
          required: ["success"],
        },
      },
      required: ["success", "data"],
    },
    400: errorResponse,
    404: errorResponse,
    500: errorResponse,
  },
};

export const wordSearchCompleteSchema = {
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
          required: ["shortUrl"],
        },
      },
      required: ["success", "data"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const wordSearchListSchema = {
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
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  userId: { type: "string" },
                  completed: { type: "boolean" },
                  foundWords: { type: "array" },
                  // Add more if needed, but keeping it flexible
                },
                additionalProperties: true,
              },
            },
            continueCursor: { type: "string", nullable: true },
          },
          required: ["items", "continueCursor"],
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminDictionaryAddSchema = {
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
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminDictionaryUpdateSchema = {
  description: "Update an existing dictionary entry (Admin)",
  tags: ["admin"],
  params: {
    type: "object",
    required: ["id"],
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
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminRedirectUrlStoreSchema = {
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
      required: ["success", "data"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const adminRedirectUrlDeleteSchema = {
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
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminRedirectUrlListSchema = {
  description: "List all redirect URLs",
  tags: ["admin"],
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              url: { type: "string" },
            },
            required: ["type", "url"],
          },
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminServiceMappingListSchema = {
  description: "List all service mappings",
  tags: ["admin"],
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              serviceName: { type: "string" },
              redirectUrlType: { type: "string" },
            },
            required: ["serviceName", "redirectUrlType"],
          },
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminPuzzlesListSchema = {
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
            items: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
            continueCursor: { type: "string", nullable: true },
          },
          required: ["items", "continueCursor"],
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminShortUrlsListSchema = {
  description: "List all short URLs",
  tags: ["admin"],
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              shortCode: { type: "string" },
              redirectUrl: { type: "string" },
              userId: { type: "string" },
              expiresAt: { type: "number" },
            },
            required: ["shortCode", "redirectUrl", "userId", "expiresAt"],
          },
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminServiceMappingStoreSchema = {
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
      required: ["success", "data"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const adminServiceMappingDeleteSchema = {
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
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const adminRedirectUrlUpdateSchema = {
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
      required: ["success", "data"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const shortUrlResolveSchema = {
  description: "Resolve short code and redirect",
  tags: ["shortUrl"],
  params: {
    type: "object",
    required: ["shortCode"],
    properties: {
      shortCode: { type: "string" },
    },
  },
  response: {
    302: { type: "null", description: "Redirect to target URL" },
    404: errorResponse,
    500: errorResponse,
  },
};

export const shortUrlInfoSchema = {
  description: "Get short URL info",
  tags: ["shortUrl"],
  params: {
    type: "object",
    required: ["shortCode"],
    properties: {
      shortCode: { type: "string" },
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
            shortCode: { type: "string" },
            redirectUrl: { type: "string" },
            userId: { type: "string" },
            expiresAt: { type: "number" },
          },
          required: ["shortCode", "redirectUrl", "userId", "expiresAt"],
        },
      },
      required: ["success", "data"],
    },
    404: errorResponse,
    500: errorResponse,
  },
};

export const shortUrlUserSchema = {
  description: "Get short URLs by user ID",
  tags: ["shortUrl"],
  params: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              shortCode: { type: "string" },
              redirectUrl: { type: "string" },
              userId: { type: "string" },
              expiresAt: { type: "number" },
            },
            required: ["shortCode", "redirectUrl", "userId", "expiresAt"],
          },
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const dictionaryListSchema = {
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
        data: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  word: { type: "string" },
                  question: { type: "string" },
                },
                required: ["word", "question"],
              },
            },
            continueCursor: { type: "string", nullable: true },
          },
          required: ["items", "continueCursor"],
        },
      },
      required: ["success", "data"],
    },
    500: errorResponse,
  },
};

export const dictionaryGetSchema = {
  description: "Get a dictionary entry by ID",
  tags: ["dictionary"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
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
            _id: { type: "string" },
            word: { type: "string" },
            question: { type: "string" },
          },
          required: ["word", "question"],
        },
      },
      required: ["success", "data"],
    },
    404: errorResponse,
    500: errorResponse,
  },
};

export const dictionaryAddSchema = {
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
      required: ["success", "data"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const dictionaryUpdateSchema = {
  description: "Update an existing dictionary entry",
  tags: ["dictionary"],
  params: {
    type: "object",
    required: ["id"],
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
      required: ["success", "data"],
    },
    404: errorResponse,
    500: errorResponse,
  },
};
