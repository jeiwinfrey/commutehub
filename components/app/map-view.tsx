"use client";

import { useEffect } from "react";
import { Map, MapRoute, MapMarker, MarkerContent, useMap } from "@/components/ui/map";
import type { GeoJSONSource } from "maplibre-gl";
import { boundsOf, circleRing, pointAt, type LngLat } from "@/lib/geo";
import type { Tracker } from "@/lib/use-tracker";
import { IconMapPin, IconArrowUp } from "central-icons";

const SEAT = { open: "#00CC3F", few: "#00A6FF", full: "#8D8D8E" } as const;

/** Compass bearing in degrees (0 = north) of a vehicle's travel, from two points a little apart on its route. */
function bearingOf(route: { geometry: number[][]; cum: number[] }, progress: number, dir: 1 | -1) {
  const a = pointAt(route, progress), b = pointAt(route, progress + dir * 80);
  const k = Math.cos((a[1] * Math.PI) / 180);
  return (Math.atan2((b[0] - a[0]) * k, b[1] - a[1]) * 180) / Math.PI;
}

function Fit({ points, pad }: { points: number[][]; pad: { top: number; bottom: number } }) {
  const { map, isLoaded } = useMap();
  const key = points.length ? `${points.length}${points[0]}${points[points.length - 1]}` : "";
  useEffect(() => {
    if (!map || !isLoaded || !points.length) return;
    map.fitBounds(boundsOf(points), { padding: { top: pad.top, bottom: pad.bottom, left: 32, right: 32 }, duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, key, pad.top, pad.bottom]);
  return null;
}

const GRAY = { land: "#E6E6EA", cover: "#E0E1E5", building: "#DCDCE1", water: "#D3D7DE", road: "#F7F7F9", line: "#CFCFD4", text: "#636366" };

/** Recolors the light basemap into soft grays so white cards stand out; no outlines or shadows. */
function GrayMap() {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const apply = () => {
      for (const l of map.getStyle().layers ?? []) {
        const id = l.id.toLowerCase();
        if (id.startsWith("route")) continue; // keep our own route layers untouched
        const set = (prop: string, v: string) => { try { map.setPaintProperty(l.id, prop as never, v as never); } catch {} };
        if (l.type === "background") set("background-color", GRAY.land);
        else if (l.type === "fill") set("fill-color", id.includes("water") ? GRAY.water : id.includes("building") ? GRAY.building : id.includes("land") || id.includes("park") ? GRAY.cover : GRAY.land);
        else if (l.type === "line") set("line-color", id.includes("water") ? GRAY.water : id.includes("road") || id.includes("bridge") || id.includes("tunnel") || id.includes("highway") ? GRAY.road : GRAY.line);
        else if (l.type === "symbol") { set("text-color", GRAY.text); set("text-halo-color", GRAY.land); }
      }
    };
    apply();
    map.on("style.load", apply);
    return () => { map.off("style.load", apply); };
  }, [map, isLoaded]);
  return null;
}

/** Translucent alert zone. Layer ids start with "route" so the gray recolor leaves them alone. */
function Zone({ center, radiusM }: { center: LngLat; radiusM: number }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const data = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circleRing(center, radiusM)] } } as GeoJSON.Feature;
    const src = map.getSource("route-zone") as GeoJSONSource | undefined;
    if (src) src.setData(data);
    else {
      map.addSource("route-zone", { type: "geojson", data });
      map.addLayer({ id: "route-zone-fill", type: "fill", source: "route-zone", paint: { "fill-color": "#00A6FF", "fill-opacity": 0.18 } });
    }
  }, [map, isLoaded, center, radiusM]);
  useEffect(() => () => {
    if (!map) return;
    try {
      if (map.getLayer("route-zone-fill")) map.removeLayer("route-zone-fill");
      if (map.getSource("route-zone")) map.removeSource("route-zone");
    } catch {}
  }, [map]);
  return null;
}

/** Zooms in on the selected vehicle's position. Runs when the selection (or the sheet height) changes, not on every move. */
function FocusVehicle({ id, at, pad }: { id: string; at: LngLat; pad: { top: number; bottom: number } }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    // sit the vehicle in the upper part of the free area (under the top cards), not its middle
    const h = map.getContainer().clientHeight;
    const free = Math.max(0, h - pad.top - pad.bottom);
    const y = pad.top + Math.max(40, free * 0.25);
    map.easeTo({ center: at, zoom: 14.5, offset: [0, y - h / 2], duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, id, pad.top, pad.bottom]);
  return null;
}

function TapToPickup({ onPick }: { onPick: (p: LngLat) => void }) {
  const { map } = useMap();
  useEffect(() => {
    if (!map) return;
    const h = (e: { lngLat: { lng: number; lat: number } }) => onPick([e.lngLat.lng, e.lngLat.lat]);
    map.on("click", h);
    return () => { map.off("click", h); };
  }, [map, onPick]);
  return null;
}

export function MapView({ t, pad = { top: 140, bottom: 260 }, pickMode = false, tapToPick = pickMode, vehicleId = null, zoneRadius = null }: { t: Tracker; pad?: { top: number; bottom: number }; pickMode?: boolean; tapToPick?: boolean; vehicleId?: string | null; zoneRadius?: number | null }) {
  const lead = t.active ?? t.services[0];
  const shown = t.active ? [t.active] : t.services;
  const ring = zoneRadius && t.pickupPoint ? circleRing(t.pickupPoint, zoneRadius) : null;
  const chosen = vehicleId && !zoneRadius && !pickMode
    ? t.services.flatMap((s) => s.vehicles.map(({ v }) => ({ v, s }))).find((x) => x.v._id === vehicleId)
    : undefined;
  const focusAt = chosen ? pointAt(chosen.s.route, chosen.v.progress) : null;
  return (
    <Map theme="light" center={[120.57, 18.1]} zoom={10} className="h-full w-full" >
      <GrayMap />
      <Fit points={ring ?? (focusAt ? [] : lead ? lead.route.geometry : [])} pad={pad} />
      {focusAt && vehicleId && <FocusVehicle id={vehicleId} at={focusAt} pad={pad} />}
      {ring && t.pickupPoint && zoneRadius && <Zone center={t.pickupPoint} radiusM={zoneRadius} />}
      {tapToPick && <TapToPickup onPick={t.setPickup} />}
      {t.services.map((s) => (
        <MapRoute
          key={s.route._id}
          coordinates={s.route.geometry as [number, number][]}
          color="#00A6FF"
          width={t.active?.route._id === s.route._id ? 8 : 7}
          opacity={t.active ? (t.active.route._id === s.route._id ? 0.55 : 0.15) : 0.35}
          interactive={false}
        />
      ))}
      {!pickMode && shown.flatMap((s) =>
        s.vehicles.filter(({ v }) => !zoneRadius || v._id === vehicleId).map(({ v, eta, status }) => {
          const [lng, lat] = pointAt(s.route, v.progress);
          const picked = v._id === vehicleId;
          // not-incoming vehicles fade back so the ones coming to you stand out
          const opacity = picked || (!vehicleId && status === "incoming") ? 1 : 0.4;
          return (
            <MapMarker key={v._id} longitude={lng} latitude={lat}>
              <MarkerContent>
                <div className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-white" style={{ background: SEAT[v.seat], opacity, transform: picked ? "scale(1.25)" : undefined }}>
                  <IconArrowUp size={14} style={{ transform: `rotate(${bearingOf(s.route, v.progress, v.dir)}deg)` }} />
                  {status === "incoming" ? `${eta}m` : ""}
                </div>
              </MarkerContent>
            </MapMarker>
          );
        }),
      )}
      {t.pickupPoint && (
        <MapMarker longitude={t.pickupPoint[0]} latitude={t.pickupPoint[1]}>
          <MarkerContent>
            <IconMapPin size={36} className="text-primary" />
          </MarkerContent>
        </MapMarker>
      )}
    </Map>
  );
}
