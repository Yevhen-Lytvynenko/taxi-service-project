/**
 * Базовий URL REST з суфіксом `/api`.
 * У `.env` можна задати `http://localhost:4000` або `http://localhost:4000/api` — обидва варіанти коректні.
 */
export function getRestApiBaseURL(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const fallback = 'http://localhost:4000/api';
  if (!raw) return fallback;
  let u = raw.replace(/\/+$/, '');
  if (!u.toLowerCase().endsWith('/api')) {
    u = `${u}/api`;
  }
  return u;
}

/** Host для Socket.IO (без `/api`). */
export function getSocketOriginFromEnv(): string {
  return getRestApiBaseURL().replace(/\/api\/?$/i, '');
}
