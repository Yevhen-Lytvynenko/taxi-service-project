/**
 * Simulate driver movement along an order's route.
 * Usage: npx ts-node scripts/simulate-order.ts --order-id=<uuid>
 *
 * Requires: backend server running (for socket). Order must be ACCEPTED with a driver.
 */

import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const STEP_MS = 2500;
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<Array<[number, number]> | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'StrumTaxi-Simulate/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null;
    return data.routes[0].geometry.coordinates; // [lng, lat][]
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  const orderId = (
    process.env.ORDER_ID ||
    process.argv.find((a) => a.startsWith('--order-id='))?.split('=')[1] ||
    process.argv.find((a) => a.startsWith('--orderId='))?.split('=')[1] ||
    process.argv.slice(2).find((a) => typeof a === 'string' && UUID_RE.test(a))
  )?.trim();
  if (!orderId) {
    console.error('Usage:');
    console.error('  npm run simulate:order -- fd48a99c-0578-48fe-8d10-d4d93ec357fa');
    console.error('  set ORDER_ID=fd48a99c-0578-48fe-8d10-d4d93ec357fa && npm run simulate:order');
    process.exit(1);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { driver: true },
  });

  if (!order) {
    console.error('Order not found:', orderId);
    process.exit(1);
  }
  if (!order.driverId || !order.driver) {
    console.error('Order has no driver. Driver must accept the order first.');
    process.exit(1);
  }
  if (order.status !== 'ACCEPTED' && order.status !== 'ARRIVED' && order.status !== 'IN_PROGRESS') {
    console.error('Order status must be ACCEPTED, ARRIVED, or IN_PROGRESS. Current:', order.status);
    process.exit(1);
  }

  const driverId = order.driverId;
  let lat: number;
  let lng: number;

  if (order.driver.currentLat != null && order.driver.currentLng != null) {
    lat = order.driver.currentLat;
    lng = order.driver.currentLng;
  } else {
    lat = order.pickupLat - 0.008;
    lng = order.pickupLng;
  }

  const socket = io(SERVER_URL);
  socket.on('connect', () => {
    console.log('Connected. Emitting location updates for driver', driverId);
    socket.emit('join_room', `driver_tracking_${driverId}`);
    socket.emit('join_room', `driver_${driverId}`);
  });

  const emitLocation = (latitude: number, longitude: number) => {
    socket.emit('update_location', {
      driverId,
      lat: latitude,
      lng: longitude,
      status: 'BUSY',
    });
    process.stdout.write('.');
  };

  let phase: 'to_pickup' | 'to_dropoff' = order.status === 'IN_PROGRESS' ? 'to_dropoff' : 'to_pickup';

  const runPhase = async () => {
    const from = phase === 'to_pickup' ? { lat, lng } : { lat: order.pickupLat, lng: order.pickupLng };
    const to = phase === 'to_pickup' ? { lat: order.pickupLat, lng: order.pickupLng } : { lat: order.dropoffLat, lng: order.dropoffLng };

    const coords = await getRoute(from, to);
    if (!coords || coords.length < 2) {
      console.error('Could not fetch route');
      return;
    }

    const points = coords.map(([lng, lat]) => ({ lat, lng }));
    let idx = 0;

    while (idx < points.length) {
      const p = points[idx];
      if (p == null) break;
      lat = p.lat;
      lng = p.lng;
      emitLocation(lat, lng);
      idx++;
      await sleep(STEP_MS);

      if (phase === 'to_pickup' && idx >= points.length - 1) {
        console.log('\nAt pickup. Waiting for IN_PROGRESS (driver: press "Клієнт сів" in app)...');
        while (true) {
          await sleep(3000);
          const updated = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true },
          });
          if (updated?.status === 'IN_PROGRESS') {
            phase = 'to_dropoff';
            lat = order.pickupLat;
            lng = order.pickupLng;
            console.log('\nSwitching to dropoff phase');
            await runPhase();
            return;
          }
          if (updated?.status === 'COMPLETED' || updated?.status === 'CANCELLED') {
            console.log('\nOrder ended.');
            return;
          }
          process.stdout.write('…');
        }
      }
      if (phase === 'to_dropoff' && idx >= points.length - 1) {
        console.log('\nReached dropoff.');
        break;
      }
    }
  };

  await runPhase();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
