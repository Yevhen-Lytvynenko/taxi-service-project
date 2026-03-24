/**
 * Order simulation service for demo: drives driver along OSRM route,
 * updates statuses (ARRIVED, IN_PROGRESS, COMPLETED).
 * Runs in background, triggered by POST /api/orders/:id/simulate.
 */

import { PrismaClient, DriverStatus } from '@prisma/client';
import { clampToOdessaDriveBounds } from '../data/odessa-addresses';
import { getSocketService } from '../lib/socket';
import { OrderService } from './order.service';

const prisma = new PrismaClient();
const orderService = new OrderService();
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const STEP_MS = 2500;

async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<Array<{ lat: number; lng: number }> | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'StrumTaxi-Simulate/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null;
    return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) =>
      clampToOdessaDriveBounds(lat, lng)
    );
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function interpolate(from: { lat: number; lng: number }, to: { lat: number; lng: number }, steps: number) {
  const points: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push(
      clampToOdessaDriveBounds(
        from.lat + t * (to.lat - from.lat),
        from.lng + t * (to.lng - from.lng)
      )
    );
  }
  return points;
}

export class OrderSimulationService {
  async run(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { driver: true },
    });

    if (!order || !order.driverId || !order.driver) {
      throw new Error('Order not found or has no driver');
    }

    const status = order.status;
    if (status !== 'ACCEPTED' && status !== 'ARRIVED' && status !== 'IN_PROGRESS') {
      throw new Error(`Cannot simulate: order status must be ACCEPTED, ARRIVED, or IN_PROGRESS. Got: ${status}`);
    }

    const driverId = order.driverId;
    const socket = getSocketService();

    let lat: number;
    let lng: number;
    if (order.driver.currentLat != null && order.driver.currentLng != null) {
      const c = clampToOdessaDriveBounds(order.driver.currentLat, order.driver.currentLng);
      lat = c.lat;
      lng = c.lng;
    } else {
      const c = clampToOdessaDriveBounds(order.pickupLat - 0.008, order.pickupLng);
      lat = c.lat;
      lng = c.lng;
    }

    const driveAlong = async (
      from: { lat: number; lng: number },
      to: { lat: number; lng: number }
    ): Promise<void> => {
      const points = await getRoute(from, to) || interpolate(from, to, 25);
      for (const p of points) {
        await socket.processLocationUpdate({
          driverId,
          lat: p.lat,
          lng: p.lng,
          status: DriverStatus.BUSY,
        });
        await sleep(STEP_MS);
      }
    };

    if (status === 'ACCEPTED') {
      await driveAlong({ lat, lng }, { lat: order.pickupLat, lng: order.pickupLng });
      lat = order.pickupLat;
      lng = order.pickupLng;

      const updated = await orderService.update(orderId, { status: 'ARRIVED' });
      socket.notifyAdminOrderUpdate(updated);
      socket.notifyOrderStatus(orderId, 'ARRIVED');

      await sleep(2000);

      const u2 = await orderService.update(orderId, {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });
      socket.notifyAdminOrderUpdate(u2);
      socket.notifyOrderStatus(orderId, 'IN_PROGRESS');

      await driveAlong(
        { lat: order.pickupLat, lng: order.pickupLng },
        { lat: order.dropoffLat, lng: order.dropoffLng }
      );
    } else if (status === 'ARRIVED') {
      const u2 = await orderService.update(orderId, {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });
      socket.notifyAdminOrderUpdate(u2);
      socket.notifyOrderStatus(orderId, 'IN_PROGRESS');

      await driveAlong(
        { lat: order.pickupLat, lng: order.pickupLng },
        { lat: order.dropoffLat, lng: order.dropoffLng }
      );
    } else {
      lat = order.pickupLat;
      lng = order.pickupLng;
      await driveAlong(
        { lat: order.pickupLat, lng: order.pickupLng },
        { lat: order.dropoffLat, lng: order.dropoffLng }
      );
    }

    const completed = await orderService.update(orderId, {
      status: 'COMPLETED',
      finishedAt: new Date(),
    });
    await prisma.driverProfile.update({
      where: { id: driverId },
      data: { status: DriverStatus.ONLINE },
    });
    socket.notifyAdminOrderUpdate(completed);
    socket.notifyOrderStatus(orderId, 'COMPLETED');
  }
}
