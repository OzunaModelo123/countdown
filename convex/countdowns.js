import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    context: v.optional(v.string()),
    bgImage: v.optional(v.string()),
    colors: v.object({
      accent: v.string(),
      accentSecondary: v.string(),
      background: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("countdowns", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const get = query({
  args: { id: v.id("countdowns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
