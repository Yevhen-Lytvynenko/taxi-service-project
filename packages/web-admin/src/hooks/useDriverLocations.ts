import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import api from '../api/axios';
import type { Driver } from '../types/map.types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

export function useDriverLocations() {
  const [drivers, setDrivers] = useState<Record<string, DriverWithDisplay>>({});
  const animFrameRef = useRef<number>();
  const prevPositionsRef = useRef<Record<string, { lat: number; lng: number }>>({});

  const applySocketUpdate = useCallback((data: Record<string, unknown> & { driverId: string; lat: number; lng: number }) => {
    const { driverId, lat, lng } = data;
    const name = (data.name as string) ?? '—';
    const status = String((data.status as string) ?? 'offline');
    const carModel = (data.carModel as string) ?? '—';
    const updatedAt = (data.updatedAt as string) ?? new Date().toISOString();

    setDrivers((prev) => {
      const existing = prev[driverId];
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
        displayLat: existing?.displayLat ?? lat,
        displayLng: existing?.displayLng ?? lng,
        displayHeading
      };
      return { ...prev, [driverId]: next };
    });
  }, []);

  useEffect(() => {
    api
      .get('/drivers?withLocation=1')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const map: Record<string, DriverWithDisplay> = {};
        for (const d of list) {
          const lat = d.currentLat ?? 0;
          const lng = d.currentLng ?? 0;
          if (lat === 0 && lng === 0) continue;
          const driverId = d.id;
          map[driverId] = {
            driverId,
            name: d.user?.fullName ?? '—',
            status: String(d.status ?? 'offline').toLowerCase(),
            lat,
            lng,
            carModel: d.vehicle?.model ?? '—',
            updatedAt: d.lastActive,
            displayLat: lat,
            displayLng: lng,
            displayHeading: 0
          };
          prevPositionsRef.current[driverId] = { lat, lng };
        }
        setDrivers((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = io(getSocketUrl());
    socket.emit('admin_connect');
    socket.on('admin:driver-update', applySocketUpdate);
    return () => {
      socket.off('admin:driver-update');
      socket.disconnect();
    };
  }, [applySocketUpdate]);

  useEffect(() => {
    const animate = () => {
      setDrivers((prev) => {
        let hasPending = false;
        const next: Record<string, DriverWithDisplay> = {};
        for (const id of Object.keys(prev)) {
          const d = prev[id];
          if (d.displayLat === d.lat && d.displayLng === d.lng) {
            next[id] = d;
            continue;
          }
          hasPending = true;
          const speed = 0.15;
          next[id] = {
            ...d,
            displayLat: lerp(d.displayLat, d.lat, speed),
            displayLng: lerp(d.displayLng, d.lng, speed)
          };
        }
        return hasPending ? next : prev;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return drivers;
}
