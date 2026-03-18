import AsyncStorage from '@react-native-async-storage/async-storage';

// Укажите ВАШ IP адрес (ipconfig в терминале) для эмулятора/устройства
//const API_URL = 'http://192.168.0.102:4000/api';
const API_URL = 'http://10.9.2.77:4000/api';
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

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

// axios-like interface: get/post return { data }
const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: object) => request('POST', path, body),
};

export default api;
