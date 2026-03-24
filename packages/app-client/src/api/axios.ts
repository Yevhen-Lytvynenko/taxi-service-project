import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_BASE } from '../config/api';

export { API_BASE };
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
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

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const hint =
      `Не вдалося з’єднатися з сервером (${API_URL}). ` +
      `Для телефону в одній Wi‑Fi створіть packages/app-client/.env з рядком EXPO_PUBLIC_API_URL=http://ВАШ_IP:4000 і перезапустіть Expo.`;
    const err = new Error(e instanceof Error && e.message ? `${e.message}. ${hint}` : hint);
    throw err;
  }

  let data: unknown;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (res.status === 401) {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    onUnauthorized?.();
  }

  if (!res.ok) {
    const err = new Error((data as { error?: string })?.error || 'Request failed');
    (err as { response?: { status: number } }).response = { status: res.status };
    throw err;
  }

  return { data };
}

// axios-like interface: get/post/put return { data }
const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: object) => request('POST', path, body),
  put: (path: string, body?: object) => request('PUT', path, body),
};

export default api;
