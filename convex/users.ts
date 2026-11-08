import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) return null;
    return ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", id.tokenIdentifier)).unique();
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) throw new Error("Not signed in");
    const existing = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", id.tokenIdentifier)).unique();
    if (existing) return existing._id;
    return ctx.db.insert("users", {
      tokenIdentifier: id.tokenIdentifier,
      name: id.name ?? "Commuter",
      email: id.email,
      photo: id.pictureUrl,
      onboarded: false,
      classTime: "08:00",
      notifyRush: true,
      notifyWeather: true,
      notifyDelay: true,
    });
  },
});

export const update = mutation({
  args: {
    onboarded: v.optional(v.boolean()),
    homePlace: v.optional(v.string()),
    schoolPlace: v.optional(v.string()),
    classTime: v.optional(v.string()),
    notifyRush: v.optional(v.boolean()),
    notifyWeather: v.optional(v.boolean()),
    notifyDelay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) throw new Error("Not signed in");
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", id.tokenIdentifier)).unique();
    if (!user) throw new Error("No user");
    await ctx.db.patch(user._id, args);
  },
});
