import { query } from "./_generated/server";
import { v } from "convex/values";

// Routes serving both places, with the travel direction (1 = forward along geometry).
export const between = query({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    const routes = await ctx.db.query("routes").collect();
    return routes.flatMap((r) => {
      const a = r.stops.find((s) => s.slug === from);
      const b = r.stops.find((s) => s.slug === to);
      if (!a || !b || a.at === b.at) return [];
      return [{ ...r, dir: (b.at > a.at ? 1 : -1) as 1 | -1, fromAt: a.at, toAt: b.at }];
    });
  },
});

export const get = query({
  args: { slug: v.string() },
  handler: (ctx, { slug }) =>
    ctx.db.query("routes").withIndex("by_slug", (q) => q.eq("slug", slug)).unique(),
});

export const all = query({ args: {}, handler: (ctx) => ctx.db.query("routes").collect() });
