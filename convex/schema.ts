import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  countdowns: defineTable({
    title: v.string(),
    date: v.string(), // ISO string
    context: v.optional(v.string()),
    bgImage: v.optional(v.string()),
    colors: v.object({
      accent: v.string(),
      accentSecondary: v.string(),
      background: v.string(),
    }),
    createdAt: v.number(),
  }),
});
