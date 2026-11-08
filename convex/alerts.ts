import { query } from "./_generated/server";

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", id.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("alerts").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(10);
  },
});
