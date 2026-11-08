import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { distanceM, pointAt } from "../lib/geo";

/** Title/body of the arrival alert, shared by the live check and the preview button. */
export function arrivalAlert(label: string, radiusM: number) {
  const km = radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`;
  return { title: `${label} is near your pickup`, body: `It just came within ${km} of your pin. Get ready to board.` };
}

async function me(ctx: QueryCtx | MutationCtx) {
  const id = await ctx.auth.getUserIdentity();
  if (!id) return null;
  return ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", id.tokenIdentifier)).unique();
}

// The user's latest alert zone that is still running or just fired.
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await me(ctx);
    if (!user) return null;
    const all = await ctx.db.query("geofences").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(5);
    return all.find((g) => g.status !== "cancelled") ?? null;
  },
});

export const start = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    dir: v.union(v.literal(1), v.literal(-1)),
    lng: v.number(),
    lat: v.number(),
    radiusM: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await me(ctx);
    if (!user) throw new Error("Not signed in");
    const vehicle = await ctx.db.get(args.vehicleId);
    const route = vehicle && (await ctx.db.get(vehicle.routeId));
    if (!vehicle || !route) throw new Error("Vehicle not found");
    // one zone at a time
    for (const g of await ctx.db.query("geofences").withIndex("by_user", (q) => q.eq("userId", user._id)).collect()) {
      if (g.status !== "cancelled") await ctx.db.patch(g._id, { status: "cancelled" });
    }
    const radiusM = Math.min(3000, Math.max(100, args.radiusM));
    const at = pointAt(route, vehicle.progress);
    await ctx.db.insert("geofences", {
      userId: user._id,
      vehicleId: vehicle._id,
      routeId: route._id,
      dir: args.dir,
      lng: args.lng,
      lat: args.lat,
      radiusM,
      inside: distanceM(at, [args.lng, args.lat]) <= radiusM && vehicle.dir === args.dir,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { id: v.id("geofences") },
  handler: async (ctx, { id }) => {
    const user = await me(ctx);
    const g = await ctx.db.get(id);
    if (!user || !g || g.userId !== user._id) return;
    await ctx.db.patch(id, { status: "cancelled" });
  },
});

// Preview button: fires the same arrival as the live check, right now.
export const simulateArrival = mutation({
  args: { id: v.id("geofences") },
  handler: async (ctx, { id }) => {
    const user = await me(ctx);
    const g = await ctx.db.get(id);
    if (!user || !g || g.userId !== user._id || g.status !== "active") return;
    const veh = await ctx.db.get(g.vehicleId);
    await ctx.db.patch(id, { inside: true, status: "triggered" });
    await ctx.db.insert("alerts", {
      userId: g.userId,
      kind: "arrival",
      ...arrivalAlert(veh?.label ?? "Your vehicle", g.radiusM),
      createdAt: Date.now(),
      read: false,
    });
  },
});
