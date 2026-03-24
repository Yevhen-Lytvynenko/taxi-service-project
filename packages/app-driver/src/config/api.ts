import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

function normalizeToApiPath(url: string): string {
  const u = url.trim().replace(/\/$/, '');
  if (u.endsWith('/api')) return u;
  return `${u}/api`;
}

export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return normalizeToApiPath(fromEnv);

  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra) return normalizeToApiPath(fromExtra);

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:4000/api';
  }

  return 'http://localhost:4000/api';
}

export const API_URL = getApiUrl();
export const API_BASE = API_URL.replace(/\/api$/, '');
