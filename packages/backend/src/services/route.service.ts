/**
 * OSRM routing proxy - returns route coordinates for map polyline.
 * https://router.project-osrm.org/
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
  coordinates: Array<[number, number]>; // [lng, lat] per GeoJSON
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
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const geometry = data.routes[0].geometry;
    const coordsArray = geometry?.coordinates;

    if (!Array.isArray(coordsArray) || coordsArray.length === 0) return null;

    return {
      coordinates: coordsArray as Array<[number, number]>,
    };
  } catch {
    return null;
  }
}
