import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const PLACES = [
  { slug: "laoag", name: "Laoag City", lat: 18.1978, lng: 120.5936 },
  { slug: "bacarra", name: "Bacarra", lat: 18.2519, lng: 120.6094 },
  { slug: "batac", name: "Batac City", lat: 18.0553, lng: 120.5642 },
  { slug: "paoay", name: "Paoay", lat: 18.0636, lng: 120.5167 },
  { slug: "badoc", name: "Badoc", lat: 17.9217, lng: 120.475 },
  { slug: "vigan", name: "Vigan City", lat: 17.5747, lng: 120.3869 },
  { slug: "mmsu", name: "MMSU Batac", lat: 18.0558, lng: 120.5436 },
];

type Type = "jeepney" | "modern_jeepney" | "bus" | "tricycle";
const ROUTES: { slug: string; name: string; type: Type; fare: number; stops: string[]; speed: number }[] = [
  { slug: "laoag-batac-paoay-jeep", name: "Laoag – Batac – Paoay", type: "jeepney", fare: 30, stops: ["laoag", "batac", "paoay"], speed: 9 },
  { slug: "laoag-batac-modern", name: "Laoag – Batac", type: "modern_jeepney", fare: 35, stops: ["laoag", "batac"], speed: 11 },
  { slug: "laoag-badoc-jeep", name: "Laoag – Badoc", type: "jeepney", fare: 45, stops: ["laoag", "badoc"], speed: 9 },
  { slug: "laoag-vigan-bus", name: "Laoag – Vigan", type: "bus", fare: 120, stops: ["laoag", "badoc", "vigan"], speed: 14 },
  { slug: "bacarra-laoag-jeep", name: "Bacarra – Laoag", type: "jeepney", fare: 20, stops: ["bacarra", "laoag"], speed: 8 },
  { slug: "batac-mmsu-trike", name: "Batac – MMSU", type: "tricycle", fare: 15, stops: ["batac", "mmsu"], speed: 6 },
];

const hav = (a: number[], b: number[]) => {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r, dLng = (b[0] - a[0]) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export const run = action({
  args: {},
  handler: async (ctx) => {
    const byslug = new Map(PLACES.map((p) => [p.slug, p]));
    const routes = [];
    for (const r of ROUTES) {
      const coords = r.stops.map((s) => `${byslug.get(s)!.lng},${byslug.get(s)!.lat}`).join(";");
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      );
      const json = await res.json();
      let pts: number[][] = json.routes[0].geometry.coordinates;
      const step = Math.max(1, Math.ceil(pts.length / 700));
      pts = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
      const stops = r.stops.map((s) => {
        const p = byslug.get(s)!;
        let best = 0, bd = Infinity;
        pts.forEach((pt, i) => { const d = hav(pt, [p.lng, p.lat]); if (d < bd) { bd = d; best = i; } });
        return { slug: p.slug, name: p.name, lat: pts[best][1], lng: pts[best][0], at: cum[best] };
      });
      routes.push({ slug: r.slug, name: r.name, type: r.type, fare: r.fare, geometry: pts, cum, stops, speed: r.speed });
    }
    await ctx.runMutation(internal.seed.store, { places: PLACES, routes });
    return `seeded ${routes.length} routes`;
  },
});

export const store = internalMutation({
  args: { places: v.array(v.any()), routes: v.array(v.any()) },
  handler: async (ctx, { places, routes }) => {
    for (const t of ["geofences", "vehicles", "routes", "places"] as const)
      for (const d of await ctx.db.query(t).collect()) await ctx.db.delete(d._id);
    for (const p of places) await ctx.db.insert("places", p);
    const seats = ["open", "few", "full"] as const;
    for (const r of routes) {
      const { speed, ...doc } = r;
      const id = await ctx.db.insert("routes", doc);
      const total = doc.cum[doc.cum.length - 1];
      const n = doc.type === "bus" ? 2 : 3;
      for (let i = 0; i < n; i++) {
        await ctx.db.insert("vehicles", {
          routeId: id,
          label: `${doc.type === "bus" ? "Bus" : doc.type === "tricycle" ? "Trike" : "Jeep"} ${100 + Math.floor(Math.random() * 899)}`,
          progress: ((i + Math.random() * 0.6) / n) * total,
          dir: i % 2 === 0 ? 1 : -1,
          speed: speed * (0.85 + Math.random() * 0.3),
          seat: seats[Math.floor(Math.random() * 3)],
          seatSetBy: "driver",
        });
      }
    }
  },
});
