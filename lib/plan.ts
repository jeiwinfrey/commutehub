import type { Doc } from "@/convex/_generated/dataModel";
import { etaMinutes } from "./geo";

type Route = Doc<"routes">;
type Vehicle = Doc<"vehicles">;
type Report = Doc<"reports">;

export type Leg = {
  route: Route;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  wait: number; // minutes waiting at the boarding point
  ride: number;
  start: number; // minutes from now when the ride departs
  end: number; // minutes from now when you arrive
  delay: number;
};
export type Trip = { legs: Leg[]; total: number; fare: number; risks: boolean[] };

const stopAt = (r: Route, slug: string) => r.stops.find((s) => s.slug === slug);

export function planTrips(routes: Route[], vehicles: Vehicle[], reports: Report[], from: string, to: string): Trip[] {
  if (from === to) return [];
  const paths: { route: Route; a: string; b: string }[][] = [];
  const dfs = (cur: string, seen: Set<string>, path: { route: Route; a: string; b: string }[]) => {
    if (path.length >= 3) return;
    for (const route of routes) {
      if (!stopAt(route, cur) || path.some((p) => p.route._id === route._id)) continue;
      for (const s of route.stops) {
        if (s.slug === cur || seen.has(s.slug)) continue;
        const next = [...path, { route, a: cur, b: s.slug }];
        if (s.slug === to) paths.push(next);
        else dfs(s.slug, new Set([...seen, s.slug]), next);
      }
    }
  };
  dfs(from, new Set([from]), []);

  const trips = paths.map((p): Trip => {
    let t = 0;
    const legs: Leg[] = p.map(({ route, a, b }) => {
      const sa = stopAt(route, a)!, sb = stopAt(route, b)!;
      const dir = (sb.at > sa.at ? 1 : -1) as 1 | -1;
      const total = route.cum[route.cum.length - 1];
      const vs = vehicles.filter((v) => v.routeId === route._id);
      const speed = vs.reduce((m, v) => m + v.speed, 0) / (vs.length || 1) || 9;
      const delay = reports.filter((r) => !r.routeId || r.routeId === route._id).reduce((m, r) => Math.max(m, r.delayMin), 0);
      const etas = vs.map((v) => etaMinutes(v, dir, sa.at, total, delay)).filter(Number.isFinite).sort((x, y) => x - y);
      const start = etas.find((e) => e >= t) ?? t + 12;
      const ride = Math.round(Math.abs(sb.at - sa.at) / speed / 60) + delay;
      const leg: Leg = { route, from: a, to: b, fromName: sa.name, toName: sb.name, wait: start - t, ride, start, end: start + ride, delay };
      t = leg.end + 3; // walking between boarding points
      return leg;
    });
    const risks = legs.slice(0, -1).map((l, i) => l.delay > 0 || legs[i + 1].wait >= 15);
    return { legs, total: legs[legs.length - 1].end, fare: legs.reduce((m, l) => m + l.route.fare * (Math.abs(l.route.stops.find((s) => s.slug === l.to)!.at - l.route.stops.find((s) => s.slug === l.from)!.at) / l.route.cum[l.route.cum.length - 1]), 0), risks };
  });
  return trips.sort((x, y) => x.legs.length - y.legs.length || x.total - y.total).slice(0, 3);
}
