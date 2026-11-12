"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { distanceM, etaMinutes, pointAt, snap, type LngLat } from "./geo";

export type Place = Doc<"places">;
export type RouteHit = Doc<"routes"> & { dir: 1 | -1; fromAt: number; toAt: number };
/** incoming: heading toward your pickup, going your way. passed: going your way but already past. other: the opposite direction. */
export type VehicleStatus = "incoming" | "passed" | "other";
export type Service = {
  route: RouteHit;
  servesPickup: boolean;
  vehicles: { v: Doc<"vehicles">; eta: number; status: VehicleStatus; distKm: number }[];
  next: number | null;
};

const statusOrder = { incoming: 0, passed: 1, other: 2 } as const;
const typeOrder = { modern_jeepney: 0, jeepney: 1, bus: 2, tricycle: 3 } as const;

export function useTracker(initialFrom: string, initialTo: string) {
  const places = useQuery(api.places.list);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [pickup, setPickup] = useState<LngLat | null>(null);
  const [pickupName, setPickupName] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const routes = useQuery(api.routes.between, from && to && from !== to ? { from, to } : "skip") as RouteHit[] | undefined;
  const vehicles = useQuery(api.vehicles.forRoutes, routes ? { routeIds: routes.map((r) => r._id) } : "skip");

  const fromPlace = places?.find((p) => p.slug === from);
  const toPlace = places?.find((p) => p.slug === to);

  // pickup spots: notable places at the origin, then named roadside stops on the way to the destination
  const pickupOptions = useMemo(() => {
    const r = routes?.[0];
    const stop = r?.stops.find((x) => x.slug === from);
    if (!r || !stop) return [];
    const total = r.cum[r.cum.length - 1];
    const origin = (fromPlace?.landmarks ?? []).map((l) => ({ name: l.name, point: pointAt(r, Math.min(total, Math.max(0, stop.at + r.dir * l.offsetM))), at: stop.at + r.dir * l.offsetM }));
    const onTheWay = (r.pickups ?? [])
      .filter((p) => (p.at - r.fromAt) * r.dir > 1200 && (r.toAt - p.at) * r.dir > 1200)
      .map((p) => ({ name: p.name, point: pointAt(r, p.at), at: p.at }));
    return [...origin, ...onTheWay].sort((a, b) => (a.at - b.at) * r.dir).map(({ name, point }) => ({ name, point }));
  }, [routes, fromPlace, from]);

  // pickup always sits on the first route's polyline (snapped); default is the first notable spot
  const pickupPoint: LngLat | null = useMemo(() => {
    if (!routes?.length) return null;
    const base = pickup ?? pickupOptions[0]?.point ?? (fromPlace ? ([fromPlace.lng, fromPlace.lat] as LngLat) : null);
    if (!base) return null;
    return snap(routes[0], base[0], base[1]).point;
  }, [routes, pickup, pickupOptions, fromPlace]);
  const pickupLabel = pickup ? (pickupName ?? "Pin on the route") : (pickupOptions[0]?.name ?? fromPlace?.name ?? "");

  const services: Service[] = useMemo(() => {
    if (!routes || !vehicles || !pickupPoint) return [];
    return routes
      .map((route) => {
        const s = snap(route, pickupPoint[0], pickupPoint[1]);
        const total = route.cum[route.cum.length - 1];
        const vs = vehicles
          .filter((v) => v.routeId === route._id)
          .map((v) => {
            const toward = v.dir === 1 ? v.progress <= s.at : v.progress >= s.at;
            const status: VehicleStatus = v.dir !== route.dir ? "other" : toward ? "incoming" : "passed";
            return { v, eta: etaMinutes(v, route.dir, s.at, total), status, distKm: Math.abs(s.at - v.progress) / 1000 };
          })
          .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.eta - b.eta);
        const servesPickup = distanceM(s.point, pickupPoint) <= 100 && (route.toAt - s.at) * route.dir > 0;
        return { route, servesPickup, vehicles: vs, next: vs.find((x) => x.status === "incoming")?.eta ?? null };
      })
      .sort((a, b) => typeOrder[a.route.type] - typeOrder[b.route.type]);
  }, [routes, vehicles, pickupPoint]);

  const active = services.find((s) => s.route.slug === selected) ?? null;

  return {
    places, from, to,
    hasRoutes: routes ? routes.length > 0 : null, // null while loading
    setFrom: (v: string) => { setFrom(v); setPickup(null); setPickupName(null); setSelected(null); },
    setTo: (v: string) => { setTo(v); setPickup(null); setPickupName(null); setSelected(null); },
    fromPlace, toPlace,
    pickupPoint, pickupLabel, pickupOptions,
    setPickup: (p: LngLat, name?: string) => { setPickup(p); setPickupName(name ?? null); },
    // back to a clean start: default pickup, no ride chosen
    reset: () => { setPickup(null); setPickupName(null); setSelected(null); },
    services, active, selected, setSelected,
    pointAt,
  };
}

export type Tracker = ReturnType<typeof useTracker>;

export const TYPE_LABEL = { jeepney: "Jeepney", modern_jeepney: "Modern jeepney", bus: "Bus", tricycle: "Tricycle" } as const;
