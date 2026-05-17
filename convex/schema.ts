import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  redirectUrls: defineTable({
    type: v.string(),
    url: v.string(),
  }).index("by_type", ["type"]),

  serviceMappings: defineTable({
    serviceName: v.string(),
    redirectUrlType: v.string(),
  }).index("by_serviceName", ["serviceName"]),

  wordSearchPuzzles: defineTable({
    id: v.string(),
    clues: v.array(
      v.object({
        word: v.string(),
        question: v.string(),
      })
    ),
    userId: v.string(),
    shortUrl: v.string(),
    grid: v.array(v.array(v.string())),
    foundWords: v.array(
      v.union(
        v.string(),
        v.object({
          word: v.string(),
          cells: v.array(
            v.object({
              x: v.number(),
              y: v.number(),
            })
          ),
        })
      )
    ),
    completed: v.boolean(),
  })
    .index("by_id", ["id"])
    .index("by_userId", ["userId"]),

  shortUrls: defineTable({
    shortCode: v.string(),
    redirectUrl: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
  })
    .index("by_shortCode", ["shortCode"])
    .index("by_userId", ["userId"]),

  dictionaries: defineTable({
    word: v.string(),
    question: v.string(),
  }).index("by_word", ["word"]),
});
