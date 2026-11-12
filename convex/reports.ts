import { internalMutation } from "./_generated/server";

export const purge = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const r of await ctx.db.query("reports").withIndex("by_expiry", (q) => q.lte("expiresAt", Date.now())).collect()) {
      await ctx.db.delete(r._id);
    }
  },
});
