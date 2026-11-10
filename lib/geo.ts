export type LngLat = [number, number];

export type RouteGeo = { geometry: number[][]; cum: number[] };

const M_PER_DEG = 111_320;

/** Nearest point on the route polyline to (lng, lat); returns meters along the route. */
export function snap(route: RouteGeo, lng: number, lat: number) {
  const k = Math.cos((lat * Math.PI) / 180);
  let best = { d: Infinity, at: 0, point: [lng, lat] as LngLat };
  for (let i = 1; i < route.geometry.length; i++) {
    const [x1, y1] = route.geometry[i - 1];
    const [x2, y2] = route.geometry[i];
    const dx = (x2 - x1) * k, dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, (((lng - x1) * k) * dx + (lat - y1) * dy) / len2));
    const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
    const d = Math.hypot((lng - px) * k, lat - py) * M_PER_DEG;
    if (d < best.d) {
      best = { d, at: route.cum[i - 1] + (route.cum[i] - route.cum[i - 1]) * t, point: [px, py] };
    }
  }
  return best;
}

/** Coordinates at `at` meters along the route. */
export function pointAt(route: RouteGeo, at: number): LngLat {
  const { cum, geometry } = route;
  const a = Math.max(0, Math.min(cum[cum.length - 1], at));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= a) lo = mid; else hi = mid;
  }
  const t = (a - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
  return [
    geometry[lo][0] + (geometry[hi][0] - geometry[lo][0]) * t,
    geometry[lo][1] + (geometry[hi][1] - geometry[lo][1]) * t,
  ];
}

/**
 * Minutes until a vehicle next reaches `pickupAt` while travelling in `dir`.
 * Vehicles keep their direction and loop back to the start of the run, so one that already
 * passed the pickup arrives again after the loop. A vehicle going the other way never serves
 * this direction, so it returns Infinity.
 */
export function etaMinutes(
  v: { progress: number; dir: 1 | -1; speed: number },
  dir: 1 | -1,
  pickupAt: number,
  total: number,
  extraDelayMin = 0,
) {
  if (v.dir !== dir) return Infinity;
  const ahead = dir * (pickupAt - v.progress);
  const dist = ahead >= -30 ? Math.max(0, ahead) : total + ahead;
  return Math.max(0, Math.round(dist / v.speed / 60 + extraDelayMin));
}

export function boundsOf(points: number[][]): [[number, number], [number, number]] {
  let w = 180, s = 90, e = -180, n = -90;
  for (const [x, y] of points) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
  return [[w, s], [e, n]];
}

export function distanceM(a: number[], b: number[]) {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r, dLng = (b[0] - a[0]) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(x));
}

/** Closed ring of [lng, lat] points approximating a circle of `radiusM` meters. */
export function circleRing(center: number[], radiusM: number, n = 64): number[][] {
  const dLat = radiusM / M_PER_DEG;
  const dLng = radiusM / (M_PER_DEG * Math.cos((center[1] * Math.PI) / 180));
  const ring = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [center[0] + Math.cos(a) * dLng, center[1] + Math.sin(a) * dLat];
  });
  return [...ring, ring[0]];
}
