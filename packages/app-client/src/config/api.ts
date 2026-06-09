import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Базовий URL API. Пріоритет:
 * 1) EXPO_PUBLIC_API_URL (повний URL)
 * 2) EXPO_PUBLIC_LAN_HOST (лише IP / hostname ПК у Wi‑Fi, порт — EXPO_PUBLIC_API_PORT або 4000)
 * 3) extra.apiUrl у app.json
 * 4) Android емулятор → 10.0.2.2
 * 5) IP з Expo (debuggerHost) або з URL бандла Metro (SourceCode.scriptURL)
 * 6) localhost
 *
 * Використовуйте getApiUrl() / getApiBase() під час запитів, а не кеш на рівні модуля —
 * інакше на девайсі інколи зчитується localhost до готовности native bridge.
 */
const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

const DEFAULT_API_PORT = Number(process.env.EXPO_PUBLIC_API_PORT) || 4000;

function normalizeToApiPath(url: string): string {
  const u = url.trim().replace(/\/$/, '');
  if (u.endsWith('/api')) return u;
  return `${u}/api`;
}

/** Тунель Expo не проксує порт бекенду — потрібен EXPO_PUBLIC_API_URL. */
function isDirectLanHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false;
  if (h.endsWith('.exp.direct') || h.includes('ngrok') || h.includes('trycloudflare')) return false;
  return true;
}

function parseHostPortString(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    if (s.includes('://')) {
      const u = new URL(s);
      if (u.hostname && isDirectLanHostname(u.hostname)) return u.hostname;
      return null;
    }
  } catch {
    /* fall through */
  }
  if (s.startsWith('[')) {
    const end = s.indexOf(']');
    if (end > 0) {
      const inner = s.slice(1, end);
      if (isDirectLanHostname(inner)) return inner;
    }
  }
  const colon = s.lastIndexOf(':');
  if (colon > 0) {
    const host = s.slice(0, colon).trim();
    if (host && isDirectLanHostname(host)) return host;
  }
  if (isDirectLanHostname(s)) return s;
  return null;
}

function hostFromExpoDebugger(): string | null {
  const raw =
    Constants.expoGoConfig?.debuggerHost ??
    (typeof Constants.manifest === 'object' &&
    Constants.manifest !== null &&
    'debuggerHost' in Constants.manifest &&
    typeof (Constants.manifest as { debuggerHost?: unknown }).debuggerHost === 'string'
      ? (Constants.manifest as { debuggerHost: string }).debuggerHost
      : undefined);
  if (!raw?.trim()) return null;
  return parseHostPortString(raw);
}

/** Хост ПК з URL JS-бандла Metro (працює в Expo Go, коли debuggerHost недоступний). */
function hostFromBundleScriptUrl(): string | null {
  try {
    const scriptURL = (
      NativeModules as { SourceCode?: { scriptURL?: string } }
    ).SourceCode?.scriptURL;
    if (!scriptURL || typeof scriptURL !== 'string') return null;
    let forParse = scriptURL.trim();
    if (!forParse.includes('://')) {
      if (forParse.startsWith('//')) forParse = `http:${forParse}`;
      else return null;
    }
    const u = new URL(forParse);
    if (u.hostname && isDirectLanHostname(u.hostname)) return u.hostname;
  } catch {
    /* ignore */
  }
  return null;
}

function resolveDevMachineHost(): string | null {
  return hostFromExpoDebugger() ?? hostFromBundleScriptUrl();
}

export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return normalizeToApiPath(fromEnv);

  const lanOnly = process.env.EXPO_PUBLIC_LAN_HOST?.trim();
  if (lanOnly) {
    return normalizeToApiPath(`http://${lanOnly}:${DEFAULT_API_PORT}`);
  }

  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra) return normalizeToApiPath(fromExtra);

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return normalizeToApiPath(`http://10.0.2.2:${DEFAULT_API_PORT}`);
  }

  const devHost = resolveDevMachineHost();
  if (devHost) {
    return normalizeToApiPath(`http://${devHost}:${DEFAULT_API_PORT}`);
  }

  return normalizeToApiPath(`http://localhost:${DEFAULT_API_PORT}`);
}

export function getApiBase(): string {
  return getApiUrl().replace(/\/api$/, '');
}
