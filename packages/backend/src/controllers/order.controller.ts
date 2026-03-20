import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { PrismaClient, DriverStatus } from '@prisma/client';
import { getSocketService } from '../lib/socket';

const orderService = new OrderService();
const prisma = new PrismaClient();

export class OrderController {
  async create(req: Request, res: Response) {
    try {
      // @ts-ignore - set by auth middleware
      const clientId = req.user?.id;
      if (!clientId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { pickupAddress, dropoffAddress, paymentMethod } = req.body;
      if (!pickupAddress || !dropoffAddress) {
        return res.status(400).json({ error: 'pickupAddress and dropoffAddress are required' });
      }

      const order = await orderService.createFromAddresses(
        clientId,
        pickupAddress,
        dropoffAddress,
        paymentMethod || 'CASH'
      );

      const onlineDrivers = await prisma.driverProfile.findMany({
        where: { status: DriverStatus.ONLINE },
        select: { id: true },
      });

      const socket = getSocketService();
      const orderPayload = {
        id: order.id,
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        distanceKm: order.distanceKm,
        totalPrice: String(order.totalPrice),
        status: order.status,
        client: order.client,
        createdAt: order.createdAt,
      };

      for (const d of onlineDrivers) {
        socket.notifyDriverNewOrder(d.id, orderPayload);
      }

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const orders = await orderService.findAll(status);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const order = await orderService.findById(req.params.id as string);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { driverId, status } = req.body;

      if (status === 'ACCEPTED' && driverId) {
        // @ts-ignore - from auth
        const tokenDriverId = req.user?.driverId;
        if (tokenDriverId && tokenDriverId !== driverId) {
          return res.status(403).json({ error: 'You can only accept orders for yourself' });
        }
        const existing = await orderService.findById(id);
        if (!existing) return res.status(404).json({ error: 'Order not found' });
        if (existing.status !== 'SEARCHING') {
          return res.status(400).json({ error: 'Order is no longer available' });
        }

        const driver = await prisma.driverProfile.findUnique({
          where: { id: driverId },
          include: { user: true, vehicle: true },
        });
        if (!driver || driver.status !== DriverStatus.ONLINE) {
          return res.status(400).json({ error: 'Driver not available' });
        }

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: {
              driver: { connect: { id: driverId } },
              status: 'ACCEPTED',
            },
          });
          await tx.driverProfile.update({
            where: { id: driverId },
            data: { status: DriverStatus.BUSY },
          });
        });

        const fullOrder = await orderService.findById(id);
        if (fullOrder) {
          getSocketService().notifyAdminOrderUpdate(fullOrder);
          getSocketService().notifyOrderStatus(id, 'ACCEPTED');
          return res.json(fullOrder);
        }
        return res.status(500).json({ error: 'Order not found after update' });
      }

      const existing = await orderService.findById(id);
      if (!existing) return res.status(404).json({ error: 'Order not found' });

      const tokenDriverId = (req as any).user?.driverId;

      if (status === 'ARRIVED') {
        if (!existing.driverId) return res.status(400).json({ error: 'Order has no driver' });
        if (tokenDriverId && tokenDriverId !== existing.driverId) {
          return res.status(403).json({ error: 'Only the driver of this order can set ARRIVED' });
        }
        if (existing.status !== 'ACCEPTED') {
          return res.status(400).json({ error: 'Can only set ARRIVED when status is ACCEPTED' });
        }
        const updated = await orderService.update(id, { status: 'ARRIVED' });
        getSocketService().notifyAdminOrderUpdate(updated);
        getSocketService().notifyOrderStatus(id, 'ARRIVED');
        return res.json(updated);
      }

      if (status === 'IN_PROGRESS') {
        if (!existing.driverId) return res.status(400).json({ error: 'Order has no driver' });
        if (tokenDriverId && tokenDriverId !== existing.driverId) {
          return res.status(403).json({ error: 'Only the driver of this order can set IN_PROGRESS (client got in)' });
        }
        if (existing.status !== 'ARRIVED') {
          return res.status(400).json({ error: 'Can only set IN_PROGRESS when status is ARRIVED (client must be picked up first)' });
        }
        const updated = await orderService.update(id, {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        });
        getSocketService().notifyAdminOrderUpdate(updated);
        getSocketService().notifyOrderStatus(id, 'IN_PROGRESS');
        return res.json(updated);
      }

      if (status === 'COMPLETED') {
        if (!existing.driverId) return res.status(400).json({ error: 'Order has no driver' });
        if (tokenDriverId && tokenDriverId !== existing.driverId) {
          return res.status(403).json({ error: 'Only the driver of this order can complete it' });
        }
        if (existing.status !== 'IN_PROGRESS') {
          return res.status(400).json({ error: 'Can only complete when status is IN_PROGRESS' });
        }
        const updated = await orderService.update(id, {
          status: 'COMPLETED',
          finishedAt: new Date(),
        });
        await prisma.driverProfile.update({
          where: { id: existing.driverId },
          data: { status: DriverStatus.ONLINE },
        });
        getSocketService().notifyAdminOrderUpdate(updated);
        getSocketService().notifyOrderStatus(id, 'COMPLETED');
        return res.json(updated);
      }

      if (status === 'CANCELLED' && existing?.driverId) {
        await prisma.driverProfile.update({
          where: { id: existing.driverId },
          data: { status: DriverStatus.ONLINE },
        });
      }

      const order = await orderService.update(id, req.body);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await orderService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}