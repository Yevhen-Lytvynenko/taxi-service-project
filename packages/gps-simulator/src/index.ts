/**
 * Standalone GPS demo service: OSRM movement + Socket.IO update_location.
 * Order lifecycle via HTTP /api/emulation/* (same contract as future IoT/phone gateway).
 */

import { io } from 'socket.io-client';
import dotenv from 'dotenv';
import { haversineDistanceKm } from './geo';
import { getRoute } from './route';
import { ODESSA_ADDRESSES, clampToOdessaDriveBounds, type OdessaAddress } from './odessa-addresses';

dotenv.config();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const EMULATION_SECRET = process.env.EMULATION_SECRET || 'emulation_secret';

const CRUISE_STEP_MS = 480;
const ORDER_LEG_STEP_MS = 550;
const ORDER_INTERVAL_MIN_MS = 45000;
const ORDER_INTERVAL_MAX_MS = 90000;
const MAX_CONCURRENT_SIMULATIONS = 8;
const CRUISE_PAUSE_MIN_MS = 800;
const CRUISE_PAUSE_MAX_MS = 3500;
let cruiseOsrmInflight = 0;
const CRUISE_OSRM_MAX_PARALLEL = 4;

type DriverStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';

interface DriverState {
  id: string;
  lat: number;
  lng: number;
  status: DriverStatus;
  routePoints: { lat: number; lng: number }[];
  routeIndex: number;
  planning: boolean;
  nextPlanAt: number;
}

interface BootstrapClient {
  id: string;
}

interface BootstrapDriver {
  id: string;
  currentLat: number | null;
  currentLng: number | null;
  status: string;
}

let clients: BootstrapClient[] = [];
let drivers: DriverState[] = [];
let socket: ReturnType<typeof io> | null = null;
let activeSimulations = 0;
let running = true;

async function api(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${SERVER_URL}/api/emulation${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Emulation-Secret': EMULATION_SECRET,
      ...(options.headers as Record<string, string>),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`[gps-simulator] ${path} -> ${res.status} ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickTwoDifferent<T>(arr: T[]): [T, T] {
  if (arr.length < 2) throw new Error('Need at least 2 addresses');
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * arr.length);
  while (j === i) j = Math.floor(Math.random() * arr.length);
  return [arr[i]!, arr[j]!];
}

function pickCruiseDestination(excludeLat: number, excludeLng: number, minKm = 0.8): { lat: number; lng: number } {
  for (let k = 0; k < 25; k++) {
    const p = pickRandom(ODESSA_ADDRESSES);
    const d = haversineDistanceKm(excludeLat, excludeLng, p.lat, p.lng);
    if (d >= minKm) return { lat: p.lat, lng: p.lng };
  }
  return { lat: ODESSA_ADDRESSES[0]!.lat, lng: ODESSA_ADDRESSES[0]!.lng };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function notifyOrder(orderId: string): Promise<void> {
  try {
    await api(`/notify-order/${orderId}`, { method: 'POST', body: '{}' });
  } catch (e) {
    console.error('[gps-simulator] notify order failed:', e);
  }
}

function emitLocation(driverId: string, lat: number, lng: number, status: string): void {
  const c = clampToOdessaDriveBounds(lat, lng);
  socket?.emit('update_location', {
    driverId,
    lat: c.lat,
    lng: c.lng,
    status,
  });
}

function alignRouteStart(
  points: { lat: number; lng: number }[],
  from: { lat: number; lng: number }
): { lat: number; lng: number }[] {
  if (points.length === 0) return points;
  const gapM = haversineDistanceKm(from.lat, from.lng, points[0]!.lat, points[0]!.lng) * 1000;
  if (gapM > 35) {
    return [{ lat: from.lat, lng: from.lng }, ...points];
  }
  const next = [...points];
  next[0] = { lat: from.lat, lng: from.lng };
  return next;
}

async function buildRoutePoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }[]> {
  const route = await getRoute(from, to);
  if (route?.coordinates?.length && route.coordinates.length >= 2) {
    const mapped = route.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const aligned = alignRouteStart(mapped, from);
    return aligned.map((p) => clampToOdessaDriveBounds(p.lat, p.lng));
  }
  const steps = Math.max(12, Math.min(40, Math.ceil(haversineDistanceKm(from.lat, from.lng, to.lat, to.lng) * 6)));
  const out: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push(
      clampToOdessaDriveBounds(
        from.lat + t * (to.lat - from.lat),
        from.lng + t * (to.lng - from.lng)
      )
    );
  }
  return out;
}

function subsamplePoints(
  points: { lat: number; lng: number }[],
  maxEveryNth: number
): { lat: number; lng: number }[] {
  if (points.length <= 2 || maxEveryNth <= 1) return points;
  const out: { lat: number; lng: number }[] = [points[0]!];
  for (let i = maxEveryNth; i < points.length - 1; i += maxEveryNth) {
    out.push(points[i]!);
  }
  out.push(points[points.length - 1]!);
  return out;
}

async function driveAlongPoints(
  driverId: string,
  points: { lat: number; lng: number }[],
  stepMs: number,
  status: string
): Promise<void> {
  for (const p of points) {
    if (!running) return;
    emitLocation(driverId, p.lat, p.lng, status);
    await sleep(stepMs);
  }
}

async function planCruiseRoute(d: DriverState): Promise<void> {
  if (d.planning || d.status !== 'ONLINE') return;
  if (Date.now() < d.nextPlanAt) return;
  if (cruiseOsrmInflight >= CRUISE_OSRM_MAX_PARALLEL) return;

  d.planning = true;
  cruiseOsrmInflight++;
  try {
    const dest = pickCruiseDestination(d.lat, d.lng);
    const raw = await buildRoutePoints({ lat: d.lat, lng: d.lng }, dest);
    if (raw.length < 2) {
      d.nextPlanAt = Date.now() + 2500;
      return;
    }
    const nth = raw.length > 220 ? 2 : 1;
    d.routePoints = subsamplePoints(raw, nth);
    d.routeIndex = 0;
  } finally {
    cruiseOsrmInflight--;
    d.planning = false;
  }
}

async function setOrderStatus(orderId: string, status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED'): Promise<void> {
  await api(`/orders/${orderId}/simulation-status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

async function setDriverOnlineAfterTrip(driverId: string, lat: number, lng: number): Promise<void> {
  const c = clampToOdessaDriveBounds(lat, lng);
  await api(`/drivers/${driverId}/set-online-location`, {
    method: 'POST',
    body: JSON.stringify({ lat: c.lat, lng: c.lng }),
  });
}

async function runLightSimulation(
  orderId: string,
  driverId: string,
  startLat: number,
  startLng: number,
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): Promise<void> {
  activeSimulations++;
  const d = drivers.find((x) => x.id === driverId);
  if (d) {
    d.routePoints = [];
    d.routeIndex = 0;
  }

  try {
    emitLocation(driverId, startLat, startLng, 'BUSY');
    await sleep(400);

    const leg1 = await buildRoutePoints({ lat: startLat, lng: startLng }, pickup);
    const smooth1 = subsamplePoints(leg1, leg1.length > 180 ? 2 : 1);
    await driveAlongPoints(driverId, smooth1, ORDER_LEG_STEP_MS, 'BUSY');

    await setOrderStatus(orderId, 'ARRIVED');
    await notifyOrder(orderId);
    await sleep(1800);

    await setOrderStatus(orderId, 'IN_PROGRESS');
    await notifyOrder(orderId);
    await sleep(600);

    const leg2 = await buildRoutePoints(pickup, dropoff);
    const smooth2 = subsamplePoints(leg2, leg2.length > 180 ? 2 : 1);
    await driveAlongPoints(driverId, smooth2, ORDER_LEG_STEP_MS, 'BUSY');

    await setOrderStatus(orderId, 'COMPLETED');
    const endPos = clampToOdessaDriveBounds(dropoff.lat, dropoff.lng);
    await setDriverOnlineAfterTrip(driverId, endPos.lat, endPos.lng);
    emitLocation(driverId, endPos.lat, endPos.lng, 'ONLINE');
    await notifyOrder(orderId);

    if (d) {
      d.status = 'ONLINE';
      d.lat = endPos.lat;
      d.lng = endPos.lng;
      d.routePoints = [];
      d.routeIndex = 0;
      d.nextPlanAt = Date.now() + randomInRange(CRUISE_PAUSE_MIN_MS, CRUISE_PAUSE_MAX_MS);
    }
  } finally {
    activeSimulations--;
  }
}

async function createAndAssignOrder(): Promise<void> {
  const online = drivers.filter((d) => d.status === 'ONLINE');
  if (online.length === 0) return;
  if (activeSimulations >= MAX_CONCURRENT_SIMULATIONS) return;
  if (clients.length === 0) return;

  try {
    const [pickup, dropoff] = pickTwoDifferent(ODESSA_ADDRESSES);
    const client = pickRandom(clients);

    const nearest = online.reduce(
      (best, d) => {
        const dist = haversineDistanceKm(d.lat, d.lng, pickup.lat, pickup.lng);
        return dist < best.dist ? { driver: d, dist } : best;
      },
      { driver: online[0]!, dist: Infinity }
    ).driver;

    const startLat = nearest.lat;
    const startLng = nearest.lng;

    nearest.routePoints = [];
    nearest.routeIndex = 0;

    const created = (await api('/orders/create-and-assign', {
      method: 'POST',
      body: JSON.stringify({
        clientId: client.id,
        pickup: pickup as OdessaAddress,
        dropoff: dropoff as OdessaAddress,
        driverId: nearest.id,
      }),
    })) as {
      orderId: string;
      pickupLat: number;
      pickupLng: number;
      dropoffLat: number;
      dropoffLng: number;
    };

    nearest.status = 'BUSY';
    await notifyOrder(created.orderId);
    void runLightSimulation(
      created.orderId,
      nearest.id,
      startLat,
      startLng,
      { lat: created.pickupLat, lng: created.pickupLng },
      { lat: created.dropoffLat, lng: created.dropoffLng }
    );
    process.stdout.write('o');
  } catch (e) {
    console.error('\n[gps-simulator] create order error:', e);
  }
}

function scheduleNextOrder(): void {
  if (!running) return;
  const delay = randomInRange(ORDER_INTERVAL_MIN_MS, ORDER_INTERVAL_MAX_MS);
  setTimeout(() => {
    void createAndAssignOrder();
    scheduleNextOrder();
  }, delay);
}

async function cruiseTick(): Promise<void> {
  if (!socket?.connected) return;

  const online = drivers.filter((d) => d.status === 'ONLINE');
  for (const d of online) {
    if (d.routePoints.length === 0 || d.routeIndex >= d.routePoints.length) {
      void planCruiseRoute(d);
      continue;
    }

    const p = d.routePoints[d.routeIndex]!;
    d.lat = p.lat;
    d.lng = p.lng;
    d.routeIndex += 1;
    emitLocation(d.id, p.lat, p.lng, 'ONLINE');

    if (d.routeIndex >= d.routePoints.length) {
      d.routePoints = [];
      d.routeIndex = 0;
      d.nextPlanAt = Date.now() + randomInRange(CRUISE_PAUSE_MIN_MS, CRUISE_PAUSE_MAX_MS);
    }
  }
}

async function main() {
  const boot = (await api('/bootstrap')) as { clients: BootstrapClient[]; drivers: BootstrapDriver[] };
  clients = boot.clients ?? [];
  if (clients.length < 5) {
    console.error('Need at least 5 clients. Run: npx prisma db seed (in packages/backend)');
    process.exit(1);
  }

  const stagger = () => Date.now() + Math.random() * 4000;

  drivers = (boot.drivers ?? []).map((p) => {
    const addr = pickRandom(ODESSA_ADDRESSES);
    const rawLat = p.currentLat ?? addr.lat;
    const rawLng = p.currentLng ?? addr.lng;
    const { lat, lng } = clampToOdessaDriveBounds(rawLat, rawLng);
    return {
      id: p.id,
      lat,
      lng,
      status: p.status as DriverStatus,
      routePoints: [] as { lat: number; lng: number }[],
      routeIndex: 0,
      planning: false,
      nextPlanAt: stagger(),
    };
  });

  const onlineCount = drivers.filter((d) => d.status === 'ONLINE').length;
  console.log(
    `[gps-simulator] ${clients.length} clients, ${drivers.length} drivers (${onlineCount} online). SERVER_URL=${SERVER_URL}`
  );

  socket = io(SERVER_URL);
  socket.on('connect', () => {
    console.log('[gps-simulator] Socket connected');
    drivers.forEach((d) => {
      socket?.emit('join_room', `driver_tracking_${d.id}`);
      socket?.emit('join_room', `driver_${d.id}`);
    });
    scheduleNextOrder();
  });

  setInterval(() => {
    void cruiseTick();
  }, CRUISE_STEP_MS);
}

process.on('SIGINT', () => {
  running = false;
  socket?.disconnect();
  process.exit(0);
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
