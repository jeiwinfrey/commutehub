import type { Doc } from "@/convex/_generated/dataModel";

type Route = Doc<"routes">;
type Stop = Route["stops"][number];
type Leg = { route: Route; from: Stop; to: Stop };

export function planTrips(routes: Route[], from: string, to: string, limitedRoute?: string) {
  if (from === to) return [];
  const paths: Leg[][] = [];

  function findPaths(current: string, seen: Set<string>, path: Leg[]) {
    if (path.length >= 3) return;
    for (const route of routes) {
      const board = route.stops.find((stop) => stop.slug === current);
      if (!board || path.some((leg) => leg.route._id === route._id)) continue;
      for (const stop of route.stops) {
        if (seen.has(stop.slug)) continue;
        const next = [...path, { route, from: board, to: stop }];
        if (stop.slug === to) paths.push(next);
        else findPaths(stop.slug, new Set([...seen, stop.slug]), next);
      }
    }
  }

  findPaths(from, new Set([from]), []);

  return paths.map((legs) => {
    const distance = legs.reduce((meters, leg) => meters + Math.abs(leg.to.at - leg.from.at), 0);
    return { legs, distance, usesLimitedRoute: legs.some(({ route }) => route.slug === limitedRoute) };
  }).sort((a, b) =>
    Number(a.usesLimitedRoute) - Number(b.usesLimitedRoute) ||
    a.legs.length - b.legs.length ||
    a.distance - b.distance,
  ).slice(0, 3);
}
