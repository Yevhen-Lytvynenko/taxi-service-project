const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
  coordinates: Array<[number, number]>;
}

export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'StrumTaxi-GpsSimulator/1.0' },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{ geometry?: { coordinates?: unknown } }>;
    };
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const coordsArray = data.routes[0].geometry?.coordinates;
    if (!Array.isArray(coordsArray) || coordsArray.length === 0) return null;

    return {
      coordinates: coordsArray as Array<[number, number]>,
    };
  } catch {
    return null;
  }
}
