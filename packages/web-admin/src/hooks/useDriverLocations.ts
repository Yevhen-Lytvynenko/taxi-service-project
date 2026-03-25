import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import api from '../api/axios';
import type { Driver } from '../types/map.types';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

interface DriverWithDisplay extends Driver {
  displayLat: number;
  displayLng: number;
  displayHeading: number;
}

const getSocketUrl = () => {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
  return base.replace(/\/api\/?$/, '');
};

/** Відсікаємо лише явний сміття (два демони, биті дані), щоб не блокувати нормальні кроки по маршруту */
function isPlausibleJump(distKm: number, dtMs: number): boolean {
  if (distKm <= 2.5) return true;
  if (dtMs >= 3000) return true;
  return false;
}

export type UseDriverLocationsOptions = {
  /** Якщо задано — у стані лише цей водій (для сторінки стеження). */
  onlyDriverId?: string;
};

export function useDriverLocations(options?: UseDriverLocationsOptions) {
  const onlyDriverId = options?.onlyDriverId;
  const [drivers, setDrivers] = useState<Record<string, DriverWithDisplay>>({});
  const prevPositionsRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const lastEventTimeRef = useRef<Record<string, number>>({});

  const applySocketUpdate = useCallback((data: Record<string, unknown> & { driverId: string; lat: number; lng: number }) => {
    const { driverId, lat, lng } = data;
    if (onlyDriverId && driverId !== onlyDriverId) {
      return;
    }
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    const name = (data.name as string) ?? '—';
    const status = String((data.status as string) ?? 'offline');
    const carModel = (data.carModel as string) ?? '—';
    const updatedAt = (data.updatedAt as string) ?? new Date().toISOString();

    setDrivers((prev) => {
      const existing = prev[driverId];
      const now = Date.now();
      const lastT = lastEventTimeRef.current[driverId] ?? 0;
      const dtMs = lastT ? now - lastT : 10_000;

      if (existing) {
        const distKm = haversineKm(existing.lat, existing.lng, lat, lng);
        if (!isPlausibleJump(distKm, dtMs)) {
          return prev;
        }
      }

      lastEventTimeRef.current[driverId] = now;

      const prevPos = prevPositionsRef.current[driverId];
      let displayHeading = existing?.displayHeading ?? 0;
      if (prevPos && (prevPos.lat !== lat || prevPos.lng !== lng)) {
        displayHeading = bearing(prevPos.lat, prevPos.lng, lat, lng);
      }
      prevPositionsRef.current[driverId] = { lat, lng };

      const next: DriverWithDisplay = {
        driverId,
        name,
        status,
        lat,
        lng,
        carModel,
        updatedAt,
        displayLat: lat,
        displayLng: lng,
        displayHeading
      };
      return { ...prev, [driverId]: next };
    });
  }, [onlyDriverId]);

  useEffect(() => {
    if (!onlyDriverId) return;
    setDrivers({});
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get<{
          currentLat?: number | null;
          currentLng?: number | null;
          status?: string;
          user?: { fullName?: string };
          vehicle?: { model?: string };
        }>(`/drivers/${onlyDriverId}`);
        if (cancelled || d?.currentLat == null || d?.currentLng == null) return;
        const lat = d.currentLat;
        const lng = d.currentLng;
        setDrivers({
          [onlyDriverId]: {
            driverId: onlyDriverId,
            name: d.user?.fullName ?? '—',
            status: String(d.status ?? 'offline').toLowerCase(),
            lat,
            lng,
            carModel: d.vehicle?.model ?? '—',
            updatedAt: new Date().toISOString(),
            displayLat: lat,
            displayLng: lng,
            displayHeading: 0,
          },
        });
        prevPositionsRef.current[onlyDriverId] = { lat, lng };
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onlyDriverId]);

  useEffect(() => {
    const socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socket.emit('admin_connect');
    socket.on('admin:driver-update', applySocketUpdate);
    return () => {
      socket.off('admin:driver-update', applySocketUpdate);
      socket.disconnect();
    };
  }, [applySocketUpdate]);

  return drivers;
}
