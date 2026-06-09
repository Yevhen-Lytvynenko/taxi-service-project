/**
 * Centralized environment helpers. JWT_SECRET is required when NODE_ENV=production.
 */

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 16) {
      throw new Error('JWT_SECRET must be set to a strong value (16+ chars) in production');
    }
    return secret;
  }
  return secret || 'super_secret_key_for_diploma_dev_only';
}

/** CORS: comma-separated origins, or * / empty for allow-all (dev only). */
export function getCorsOrigin():
  | boolean
  | string
  | RegExp
  | (string | RegExp)[]
  | undefined {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === '*') {
    return process.env.NODE_ENV === 'production' ? false : '*';
  }
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length === 1 ? parts[0]! : parts;
}

export function getSocketIoCorsOrigin(): string | string[] | undefined {
  const o = getCorsOrigin();
  if (o === false) return undefined;
  if (o === true) return '*';
  if (Array.isArray(o)) return o.map(String);
  if (o instanceof RegExp) return undefined;
  return String(o);
}

export function getMatchingRadiusKm(): number {
  const n = Number(process.env.MATCHING_RADIUS_KM);
  return Number.isFinite(n) && n > 0 ? n : 8;
}

export function getMatchDeadlineSeconds(): number {
  const n = Number(process.env.MATCH_DEADLINE_SECONDS);
  return Number.isFinite(n) && n >= 30 ? n : 120;
}

/** Platform commission rate applied to completed order total (0–1). */
export function getPlatformCommissionRate(): number {
  const n = Number(process.env.PLATFORM_COMMISSION_RATE);
  if (!Number.isFinite(n) || n < 0 || n >= 1) return 0.15;
  return n;
}

export function getSurgeMultiplier(): number {
  const h = new Date().getHours();
  const isPeak = (h >= 8 && h < 10) || (h >= 17 && h < 20);
  const peak = Number(process.env.SURGE_PEAK_MULTIPLIER);
  const peakM = Number.isFinite(peak) && peak >= 1 ? peak : 1.25;
  return isPeak ? peakM : 1;
}

export function getRedisUrl(): string | undefined {
  const u = process.env.REDIS_URL?.trim();
  return u || undefined;
}

/** Google Maps Platform key for Directions API (server-side only). */
export function getGoogleMapsApiKey(): string | undefined {
  const k = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return k || undefined;
}
