import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { distanceM, pointAt } from "../lib/geo";
import { arrivalAlert } from "./geofences";

export const byRoute = query({
  args: { routeId: v.id("routes") },
  handler: (ctx, { routeId }) =>
    ctx.db.query("vehicles").withIndex("by_route", (q) => q.eq("routeId", routeId)).collect(),
});

// Advances every vehicle along its route; called by cron.
export const tick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const routes = new Map((await ctx.db.query("routes").collect()).map((r) => [r._id, r]));
    const now = Date.now();
    const slow = (await ctx.db.query("reports").collect()).filter((r) => r.expiresAt > now);
    const moved = new Map<string, { progress: number; dir: 1 | -1 }>();
    for (const veh of await ctx.db.query("vehicles").collect()) {
      const route = routes.get(veh.routeId);
      if (!route) continue;
      const total = route.cum[route.cum.length - 1];
      const factor = slow.some((r) => r.routeId === veh.routeId) ? 0.5 : 1;
      let progress = veh.progress + veh.dir * veh.speed * 10 * factor;
      const dir = veh.dir; // fixed role: outbound vehicles always head to the destination, inbound ones back
      if (dir === 1 && progress >= total) progress -= total; // back to the start of the run
      if (dir === -1 && progress <= 0) progress += total;
      const roll = Math.random();
      const seat = roll < 0.06 ? (["open", "few", "full"] as const)[Math.floor(Math.random() * 3)] : veh.seat;
      moved.set(veh._id, { progress, dir });
      await ctx.db.patch(veh._id, {
        progress,
        dir,
        seat,
      });
    }

    // alert zones: fire once when the chosen vehicle enters while heading toward the pickup
    for (const g of await ctx.db.query("geofences").withIndex("by_status", (q) => q.eq("status", "active")).collect()) {
      const m = moved.get(g.vehicleId);
      const veh = await ctx.db.get(g.vehicleId);
      const route = routes.get(g.routeId);
      if (!m || !veh || !route) continue;
      const inside = m.dir === g.dir && distanceM(pointAt(route, m.progress), [g.lng, g.lat]) <= g.radiusM;
      if (inside && !g.inside) {
        await ctx.db.patch(g._id, { inside: true, status: "triggered" });
        await ctx.db.insert("alerts", {
          userId: g.userId,
          kind: "arrival",
          ...arrivalAlert(veh.label, g.radiusM),
          createdAt: Date.now(),
          read: false,
        });
      } else if (inside !== g.inside) {
        await ctx.db.patch(g._id, { inside });
      }
    }
  },
});

export const forRoutes = query({
  args: { routeIds: v.array(v.id("routes")) },
  handler: async (ctx, { routeIds }) => {
    const out = [];
    for (const routeId of routeIds) {
      out.push(...(await ctx.db.query("vehicles").withIndex("by_route", (q) => q.eq("routeId", routeId)).collect()));
    }
    return out;
  },
});

export const all = query({ args: {}, handler: (ctx) => ctx.db.query("vehicles").collect() });
