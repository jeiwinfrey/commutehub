import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const active = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return (await ctx.db.query("reports").withIndex("by_expiry", (q) => q.gt("expiresAt", now)).collect());
  },
});

export const create = mutation({
  args: {
    kind: v.union(v.literal("roadworks"), v.literal("accident"), v.literal("traffic"), v.literal("flood")),
    delayMin: v.number(),
    routeId: v.optional(v.id("routes")),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();
    await ctx.db.insert("reports", {
      ...args,
      createdAt: now,
      expiresAt: now + 45 * 60 * 1000, // reports expire after 45 min
      authorName: identity?.givenName ?? identity?.name ?? "A commuter",
    });
  },
});

export const purge = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const r of await ctx.db.query("reports").withIndex("by_expiry", (q) => q.lte("expiresAt", Date.now())).collect()) {
      await ctx.db.delete(r._id);
    }
  },
});
