"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { etaMinutes, pointAt, snap, type LngLat } from "./geo";

export type Place = Doc<"places">;
export type RouteHit = Doc<"routes"> & { dir: 1 | -1; fromAt: number; toAt: number };
/** incoming: heading toward your pickup, going your way. passed: going your way but already past. other: the opposite direction. */
export type VehicleStatus = "incoming" | "passed" | "other";
export type Service = {
  route: RouteHit;
  pickupAt: number;
  vehicles: { v: Doc<"vehicles">; eta: number; status: VehicleStatus; distKm: number }[];
  next: number | null;
  rideMin: number;
};

const statusOrder = { incoming: 0, passed: 1, other: 2 } as const;
const typeOrder = { modern_jeepney: 0, jeepney: 1, bus: 2, tricycle: 3 } as const;

export function useTracker() {
  const places = useQuery(api.places.list);
  const [from, setFrom] = useState("laoag");
  const [to, setTo] = useState("batac");
  const [pickup, setPickup] = useState<LngLat | null>(null);
  const [pickupName, setPickupName] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const routes = useQuery(api.routes.between, from && to && from !== to ? { from, to } : "skip") as RouteHit[] | undefined;
  const vehicles = useQuery(api.vehicles.forRoutes, routes ? { routeIds: routes.map((r) => r._id) } : "skip");
  const reports = useQuery(api.reports.active) ?? [];

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
        const delay = reports.filter((r) => !r.routeId || r.routeId === route._id).reduce((m, r) => Math.max(m, r.delayMin), 0);
        const total = route.cum[route.cum.length - 1];
        const vs = vehicles
          .filter((v) => v.routeId === route._id)
          .map((v) => {
            const toward = v.dir === 1 ? v.progress <= s.at : v.progress >= s.at;
            const status: VehicleStatus = v.dir !== route.dir ? "other" : toward ? "incoming" : "passed";
            return { v, eta: etaMinutes(v, route.dir, s.at, total, delay), status, distKm: Math.abs(s.at - v.progress) / 1000 };
          })
          .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.eta - b.eta);
        const avg = vehicles.filter((v) => v.routeId === route._id).reduce((a, v) => a + v.speed, 0) / 4 || 9;
        const rideMin = Math.round(Math.abs(route.toAt - s.at) / avg / 60) + delay;
        return { route, pickupAt: s.at, vehicles: vs, next: vs.find((x) => x.status === "incoming")?.eta ?? vs.find((x) => x.status === "passed")?.eta ?? null, rideMin };
      })
      .sort((a, b) => typeOrder[a.route.type] - typeOrder[b.route.type]);
  }, [routes, vehicles, pickupPoint, reports]);

  const active = services.find((s) => s.route.slug === selected) ?? null;
  const delayMin = reports.reduce((m, r) => Math.max(m, r.delayMin), 0);
  const createReport = useMutation(api.reports.create);

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
    reports, delayMin,
    report: (kind: Doc<"reports">["kind"], delay: number) => {
      const at = pickupPoint ?? [120.59, 18.19];
      return createReport({ kind, delayMin: delay, routeId: active?.route._id as Id<"routes"> | undefined, lng: at[0], lat: at[1] });
    },
    pointAt,
  };
}

export type Tracker = ReturnType<typeof useTracker>;

export const TYPE_LABEL = { jeepney: "Jeepney", modern_jeepney: "Modern jeepney", bus: "Bus", tricycle: "Tricycle" } as const;

export const fmt12 = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** The ride the Leave-by time is based on: the chosen one, else whichever comes soonest. */
export function bestService(t: Pick<Tracker, "active" | "services">) {
  return t.active ?? [...t.services].filter((s) => s.next !== null).sort((a, b) => a.next! - b.next!)[0] ?? null;
}

/** Minutes after midnight when you should leave (can be negative if it falls on the previous day). */
export function leaveByMinutes(classTime: string, svc: Service | null, delayMin: number, bufferMin = 10) {
  const [h, m] = classTime.split(":").map(Number);
  const wait = svc?.next ?? 0;
  const ride = svc?.rideMin ?? 30;
  return h * 60 + m - (wait + ride + bufferMin + (svc ? 0 : delayMin));
}

export function leaveBy(classTime: string, svc: Service | null, delayMin: number, bufferMin = 10) {
  return fmt12(leaveByMinutes(classTime, svc, delayMin, bufferMin)).replace(/ [AP]M$/, "");
}
