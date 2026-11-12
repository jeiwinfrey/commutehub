import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { arrivalAlert } from "./geofences";

async function me(ctx: QueryCtx | MutationCtx) {
  const id = await ctx.auth.getUserIdentity();
  if (!id) return null;
  return ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", id.tokenIdentifier)).unique();
}

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await me(ctx);
    if (!user) return [];
    return ctx.db.query("alerts").withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.or(q.eq(q.field("kind"), "weather"), q.eq(q.field("kind"), "arrival")))
      .order("desc").take(10);
  },
});

// Sample content for each alert kind, used by the preview buttons.
const SAMPLES = {
  weather: { title: "70% chance of rain", body: "Bring an umbrella or rain jacket before you leave." },
} as const;

// Creates one alert of the given kind for the signed-in user, the same way a real one is created.
export const preview = mutation({
  args: { kind: v.union(v.literal("weather"), v.literal("arrival")) },
  handler: async (ctx, { kind }) => {
    const user = await me(ctx);
    if (!user) throw new Error("Not signed in");
    const content = kind === "arrival"
      ? arrivalAlert((await ctx.db.query("vehicles").first())?.label ?? "Your vehicle", 500)
      : SAMPLES[kind];
    await ctx.db.insert("alerts", { userId: user._id, kind, ...content, createdAt: Date.now(), read: false });
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await me(ctx);
    if (!user) return;
    for (const a of await ctx.db.query("alerts").withIndex("by_user", (q) => q.eq("userId", user._id)).collect()) {
      await ctx.db.delete(a._id);
    }
  },
});
