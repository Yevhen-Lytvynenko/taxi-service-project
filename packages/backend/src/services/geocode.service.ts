/**
 * Geocoding via OpenStreetMap Nominatim (free, no API key).
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  /** Повна адреса (Nominatim display_name). */
  displayName: string;
  /** Скорочений підпис без індексу та країни — для полів у застосунку. */
  shortLabel: string;
}

function shortenDisplayName(displayName: string): string {
  const parts = displayName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const skip = (p: string) =>
    /^\d{5}(-\d{4})?$/.test(p) || /україна|ukraine|украина|ukr\b/i.test(p) || /^область\b/i.test(p);
  const filtered = parts.filter((p) => !skip(p));
  return filtered.slice(0, 3).join(', ') || displayName;
}

function nominatimAddressToShortLabel(addr: Record<string, unknown>): string {
  const a = addr as Record<string, string | undefined>;
  const road = a.road || a.pedestrian || a.path || '';
  const hn = a.house_number;
  let line1 = '';
  if (road && hn) line1 = `${road}, ${hn}`;
  else if (road) line1 = road;
  else line1 = a.amenity || a.building || a.shop || '';
  const district = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const parts = [line1, district, city].filter((x) => x && String(x).length > 0);
  return parts.join(' · ');
}

function enrichFromNominatimItem(item: {
  display_name?: string;
  address?: Record<string, unknown>;
  lat?: string;
  lon?: string;
}): { lat: number; lng: number; displayName: string; shortLabel: string } | null {
  const lat = parseFloat(item.lat ?? '');
  const lng = parseFloat(item.lon ?? '');
  if (isNaN(lat) || isNaN(lng)) return null;
  const displayName = item.display_name ?? `${lat}, ${lng}`;
  const addr = item.address && typeof item.address === 'object' ? item.address : null;
  const shortFromAddr = addr ? nominatimAddressToShortLabel(addr) : '';
  const shortLabel = shortFromAddr || shortenDisplayName(displayName);
  return { lat, lng, displayName, shortLabel };
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'StrumTaxi/1.0';

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) return null;

  const params = new URLSearchParams({
    q: address.trim(),
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const item = data[0];
  const enriched = enrichFromNominatimItem(item);
  if (!enriched) return null;
  return {
    ...enriched,
    displayName: enriched.displayName || address,
  };
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) return null;

  const item = await res.json();
  if (!item || item.error) return null;

  const enriched = enrichFromNominatimItem(item);
  if (!enriched) return null;
  return enriched;
}

/**
 * Haversine formula - distance in km between two points.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
