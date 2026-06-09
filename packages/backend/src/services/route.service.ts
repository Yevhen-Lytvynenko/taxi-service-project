/**
 * OSRM routing proxy - returns route geometry and metrics for planned vs actual analytics.
 * https://router.project-osrm.org/
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
/** Публічний OSRM часто відповідає повільно; обмежуємо очікування, щоб не блокувати водія. */
const OSRM_FETCH_TIMEOUT_MS = 14_000;

function osrmFetchSignal(): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(OSRM_FETCH_TIMEOUT_MS);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), OSRM_FETCH_TIMEOUT_MS);
  return c.signal;
}

export interface RouteResult {
  /** [lng, lat] per GeoJSON line */
  coordinates: Array<[number, number]>;
  distanceKm: number;
  durationMinutes: number;
}

/** Відстань між двома точками [lng, lat] у метрах (WGS84). */
export function haversineMeters(
  a: [number, number],
  b: [number, number]
): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function distancePointToSegmentMeters(
  p: [number, number],
  s0: [number, number],
  s1: [number, number]
): number {
  const [px, py] = p;
  const [x0, y0] = s0;
  const [x1, y1] = s1;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-18) return haversineMeters(p, s0);
  let t = ((px - x0) * dx + (py - y0) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj: [number, number] = [x0 + t * dx, y0 + t * dy];
  return haversineMeters(p, proj);
}

function minDistancePointToPolylineMeters(
  p: [number, number],
  poly: Array<[number, number]>
): number {
  let m = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    m = Math.min(m, distancePointToSegmentMeters(p, poly[i]!, poly[i + 1]!));
  }
  return m;
}

function subsampleCoords(
  coords: Array<[number, number]>,
  maxPoints: number
): Array<[number, number]> {
  if (coords.length <= maxPoints) return coords;
  const out: Array<[number, number]> = [];
  const step = (coords.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    out.push(coords[Math.min(idx, coords.length - 1)]!);
  }
  return out;
}

/** Наближений directed Hausdorff max(min відстань від зразків A до полілінії B, і симетрично). */
export function polylineHausdorffMaxMeters(
  a: Array<[number, number]>,
  b: Array<[number, number]>,
  sampleCap = 56
): number {
  if (a.length < 2 || b.length < 2) return Infinity;
  const sa = subsampleCoords(a, sampleCap);
  const sb = subsampleCoords(b, sampleCap);
  let hAB = 0;
  for (const p of sa) hAB = Math.max(hAB, minDistancePointToPolylineMeters(p, b));
  let hBA = 0;
  for (const p of sb) hBA = Math.max(hBA, minDistancePointToPolylineMeters(p, a));
  return Math.max(hAB, hBA);
}

export function polylineLengthMeters(coords: Array<[number, number]>): number {
  let s = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    s += haversineMeters(coords[i]!, coords[i + 1]!);
  }
  return s;
}

/**
 * true, якщо дві геометрії фактично той самий коридор (той самий набір вулиць / майже паралельні шляхи).
 * Для різних варіантів потрібна помітна розбіжність у просторі.
 */
export function arePolylinesSameCorridor(
  a: Array<[number, number]>,
  b: Array<[number, number]>
): boolean {
  if (a.length < 2 || b.length < 2) return false;
  const h = polylineHausdorffMaxMeters(a, b);
  const len = Math.min(polylineLengthMeters(a), polylineLengthMeters(b));
  const needApartM = Math.max(200, Math.min(520, len * 0.05));
  return h < needApartM;
}

function mapOsrmRoutes(data: {
  routes?: Array<{
    geometry?: { coordinates?: unknown };
    distance?: number;
    duration?: number;
  }>;
}): RouteResult[] {
  const raw = data.routes;
  if (!Array.isArray(raw)) return [];
  const out: RouteResult[] = [];
  for (const route of raw) {
    const coordsArray = route.geometry?.coordinates;
    if (!Array.isArray(coordsArray) || coordsArray.length < 2) continue;
    const distanceM = typeof route.distance === 'number' ? route.distance : 0;
    const durationSec = typeof route.duration === 'number' ? route.duration : 0;
    out.push({
      coordinates: coordsArray as Array<[number, number]>,
      distanceKm: distanceM / 1000,
      durationMinutes: durationSec / 60,
    });
  }
  return out;
}

export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'StrumTaxi/1.0' },
      signal: osrmFetchSignal(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const geometry = route.geometry;
    const coordsArray = geometry?.coordinates;

    if (!Array.isArray(coordsArray) || coordsArray.length === 0) return null;

    const distanceM = typeof route.distance === 'number' ? route.distance : 0;
    const durationSec = typeof route.duration === 'number' ? route.duration : 0;

    return {
      coordinates: coordsArray as Array<[number, number]>,
      distanceKm: distanceM / 1000,
      durationMinutes: durationSec / 60,
    };
  } catch {
    return null;
  }
}

/** Кілька варіантів маршруту (публічний OSRM, до ~3 альтернатив). */
export async function getRouteAlternativesFromOsrm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult[]> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&alternatives=true`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'StrumTaxi/1.0' },
      signal: osrmFetchSignal(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.code !== 'Ok') return [];
    return mapOsrmRoutes(data);
  } catch {
    return [];
  }
}

/**
 * Другий варіант через проміжну точку (зміщення від середини сегмента),
 * якщо OSRM alternatives повернув лише один маршрут.
 */
export async function getRouteWithViaWaypoint(
  from: { lat: number; lng: number },
  via: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  const coords = `${from.lng},${from.lat};${via.lng},${via.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'StrumTaxi/1.0' },
      signal: osrmFetchSignal(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coordsArray = route.geometry?.coordinates;
    if (!Array.isArray(coordsArray) || coordsArray.length < 2) return null;
    const distanceM = typeof route.distance === 'number' ? route.distance : 0;
    const durationSec = typeof route.duration === 'number' ? route.duration : 0;
    return {
      coordinates: coordsArray as Array<[number, number]>,
      distanceKm: distanceM / 1000,
      durationMinutes: durationSec / 60,
    };
  } catch {
    return null;
  }
}

export type DetourViaOptions = {
  /** Частка від from до to (0–1), де ставимо зміщену точку. */
  fractionAlong?: number;
  /** Напрямок перпендикуляра до хорди. */
  side?: 1 | -1;
  /** Зміщення перпендикулярно до напрямку руху, метри. */
  offsetMeters?: number;
};

/**
 * Проміжна точка поза прямою from→to (локальна ENU), щоб OSRM будував іншу гілку дорожньої мережі.
 */
export function detourViaPoint(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  options?: DetourViaOptions
): { lat: number; lng: number } {
  const t = options?.fractionAlong ?? 0.5;
  const side = options?.side ?? 1;
  const meters = options?.offsetMeters ?? 520;
  const lat = from.lat + t * (to.lat - from.lat);
  const lng = from.lng + t * (to.lng - from.lng);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.max(0.25, Math.abs(cosLat));
  let dx = (to.lng - from.lng) * mPerDegLng;
  let dy = (to.lat - from.lat) * mPerDegLat;
  const segLen = Math.sqrt(dx * dx + dy * dy) || 1e-6;
  dx /= segLen;
  dy /= segLen;
  const px = -dy * side * meters;
  const py = dx * side * meters;
  return {
    lat: lat + py / mPerDegLat,
    lng: lng + px / mPerDegLng,
  };
}

/**
 * Кілька стратегічних via-точок (різні місця вздовж хорди, сторони й радіус), щоб отримати реально різні вулиці.
 */
export function strategicDetourWaypoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Array<{ lat: number; lng: number }> {
  const specs: Array<{ fractionAlong: number; side: 1 | -1; offsetMeters: number }> = [
    { fractionAlong: 0.36, side: 1, offsetMeters: 720 },
    { fractionAlong: 0.36, side: -1, offsetMeters: 720 },
    { fractionAlong: 0.52, side: 1, offsetMeters: 980 },
    { fractionAlong: 0.52, side: -1, offsetMeters: 980 },
    { fractionAlong: 0.42, side: 1, offsetMeters: 1250 },
    { fractionAlong: 0.58, side: -1, offsetMeters: 1250 },
    { fractionAlong: 0.28, side: -1, offsetMeters: 600 },
    { fractionAlong: 0.65, side: 1, offsetMeters: 600 },
  ];
  return specs.map((s) => detourViaPoint(from, to, s));
}
