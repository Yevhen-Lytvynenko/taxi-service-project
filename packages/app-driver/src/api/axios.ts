import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, getApiBase } from '../config/api';

export { getApiBase };
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
}

const REQUEST_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

function withQuery(path: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return path;
  const q = new URLSearchParams(params).toString();
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${q}`;
}

async function request(
  method: string,
  path: string,
  body?: object
): Promise<{ data: unknown }> {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const apiUrl = getApiUrl();
  let res: Response;
  try {
    res = await fetchWithTimeout(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        `Сервер не відповів за ${REQUEST_TIMEOUT_MS / 1000} с (${apiUrl}). ` +
          `Перевірте бекенд; у .env: EXPO_PUBLIC_LAN_HOST=ВАШ_IP або EXPO_PUBLIC_API_URL=http://ВАШ_IP:4000/api.`
      );
    }
    const hint =
      `Не вдалося з’єднатися з сервером (${apiUrl}). ` +
      `У packages/app-driver/.env додайте EXPO_PUBLIC_LAN_HOST=ВАШ_IP і перезапустіть Expo.`;
    throw new Error(e instanceof Error && e.message ? `${e.message}. ${hint}` : hint);
  }

  let data: unknown;
  if (res.status === 204 || res.status === 205) {
    data = null;
  } else {
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text };
    }
  }

  if (res.status === 401) {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    onUnauthorized?.();
  }

  if (!res.ok) {
    const err = new Error((data as { error?: string })?.error || 'Request failed');
    (err as { response?: { status: number; data?: unknown } }).response = { status: res.status, data };
    throw err;
  }

  return { data };
}

// axios-like interface: get/post/put/patch return { data }
const api = {
  get: (path: string, init?: { params?: Record<string, string> }) =>
    request('GET', withQuery(path, init?.params)),
  post: (path: string, body?: object) => request('POST', path, body),
  put: (path: string, body?: object) => request('PUT', path, body),
  patch: (path: string, body?: object) => request('PATCH', path, body),
  delete: (path: string) => request('DELETE', path),
};

export default api;
