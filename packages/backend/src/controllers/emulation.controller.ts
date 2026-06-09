import { Request, Response } from 'express';
import { Prisma, OrderStatus, DriverStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OrderService } from '../services/order.service';
import { getSocketService } from '../lib/socket';
import { getPlatformCommissionRate } from '../config/env';

import { prisma } from '../lib/prisma';

const orderService = new OrderService();

export async function bootstrap(_req: Request, res: Response) {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true },
    });
    const drivers = await prisma.driverProfile.findMany({
      where: { status: { in: ['ONLINE', 'OFFLINE'] } },
      select: { id: true, currentLat: true, currentLng: true, status: true },
    });
    res.json({ clients, drivers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
}

export async function createAndAssignOrder(req: Request, res: Response) {
  try {
    const { clientId, pickup, dropoff, driverId } = req.body as {
      clientId?: string;
      pickup?: { lat: number; lng: number; displayName: string };
      dropoff?: { lat: number; lng: number; displayName: string };
      driverId?: string;
    };
    if (!clientId || !pickup || !dropoff || !driverId) {
      return res.status(400).json({ error: 'Missing clientId, pickup, dropoff, or driverId' });
    }
    if (
      typeof pickup.lat !== 'number' ||
      typeof pickup.lng !== 'number' ||
      typeof dropoff.lat !== 'number' ||
      typeof dropoff.lng !== 'number'
    ) {
      return res.status(400).json({ error: 'pickup and dropoff must include numeric lat/lng' });
    }

    const driver = await prisma.driverProfile.findUnique({ where: { id: driverId } });
    if (!driver || driver.status !== 'ONLINE') {
      return res.status(400).json({ error: 'Driver not found or not ONLINE' });
    }

    const order = await orderService.createFromCoordinates(clientId, pickup, dropoff, {
      paymentMethod: 'CASH',
    });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { driverId, status: 'ACCEPTED' },
      }),
      prisma.driverProfile.update({
        where: { id: driverId },
        data: { status: 'BUSY' },
      }),
    ]);

    const full = await orderService.findById(order.id);
    if (full) {
      getSocketService().notifyAdminOrderUpdate(full);
      getSocketService().notifyOrderStatus(order.id, 'ACCEPTED');
    }

    res.json({
      orderId: order.id,
      pickupLat: order.pickupLat,
      pickupLng: order.pickupLng,
      dropoffLat: order.dropoffLat,
      dropoffLng: order.dropoffLng,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
}

export async function setOrderSimulationStatus(req: Request, res: Response) {
  const id = req.params.id as string;
  const { status } = req.body as { status?: string };
  const allowed: OrderStatus[] = ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
  if (!status || !allowed.includes(status as OrderStatus)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const nextStatus = status as OrderStatus;

    if (nextStatus === 'IN_PROGRESS') {
      await orderService.update(id, { status: nextStatus, startedAt: new Date() });
    } else if (nextStatus === 'COMPLETED') {
      const existing = await orderService.findById(id);
      if (!existing) return res.status(404).json({ error: 'Order not found' });

      const total = Number(existing.totalPrice);
      const rate = getPlatformCommissionRate();
      const platformFeeNum = Number((total * rate).toFixed(2));
      const driverEarnNum = Number((total - platformFeeNum).toFixed(2));
      const platformFee = new Decimal(platformFeeNum);
      const driverEarn = new Decimal(driverEarnNum);

      const existingTx = await prisma.transaction.findFirst({ where: { orderId: id } });

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
            platformFeeAmount: platformFee,
            driverEarningAmount: driverEarn,
          },
        });
        if (existing.driverId) {
          await tx.driverProfile.update({
            where: { id: existing.driverId },
            data: { status: DriverStatus.ONLINE, balance: { increment: driverEarn } },
          });
        }
        if (!existingTx && existing.driverId) {
          await tx.transaction.create({
            data: {
              driverId: existing.driverId,
              orderId: id,
              amount: driverEarn,
              type: 'ORDER_EARNING',
            },
          });
        }
      });
    } else {
      await orderService.update(id, { status: nextStatus });
    }

    const full = await orderService.findById(id);
    if (full) {
      getSocketService().notifyAdminOrderUpdate(full);
      getSocketService().notifyOrderStatus(id, nextStatus);
    }
    res.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
}

export async function setDriverOnlineLocation(req: Request, res: Response) {
  const id = req.params.id as string;
  const { lat, lng } = req.body as { lat?: number; lng?: number };
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng must be numbers' });
  }

  try {
    await prisma.driverProfile.update({
      where: { id },
      data: { status: 'ONLINE', currentLat: lat, currentLng: lng },
    });
    res.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
}
