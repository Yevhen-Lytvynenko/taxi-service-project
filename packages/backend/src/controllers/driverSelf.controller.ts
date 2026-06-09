import { Request, Response } from 'express';
import { DriverService } from '../services/driver.service';
import { DriverStatus } from '@prisma/client';

import { prisma } from '../lib/prisma';

const driverService = new DriverService();

export class DriverSelfController {
  async getMyEarnings(req: Request, res: Response) {
    try {
      const driverId = req.user?.driverId;
      if (!driverId) {
        return res.status(403).json({ error: 'Driver profile not found' });
      }
      const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400000);
      const to = req.query.to ? new Date(String(req.query.to)) : new Date();
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      const trips = await prisma.order.findMany({
        where: {
          driverId,
          status: 'COMPLETED',
          finishedAt: { gte: from, lte: end },
        },
        select: {
          id: true,
          finishedAt: true,
          driverEarningAmount: true,
          totalPrice: true,
          distanceKm: true,
          pickupAddress: true,
          dropoffAddress: true,
        },
        orderBy: { finishedAt: 'desc' },
      });

      const totalDriverEarning = trips.reduce((s, r) => s + Number(r.driverEarningAmount ?? 0), 0);

      res.json({
        from: from.toISOString(),
        to: end.toISOString(),
        tripCount: trips.length,
        totalDriverEarning,
        trips,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      // @ts-ignore - set by auth middleware
      const driverId = req.user?.driverId;
      if (!driverId) {
        return res.status(403).json({ error: 'Driver profile not found' });
      }

      const { status } = req.body;
      if (!status || !['ONLINE', 'OFFLINE'].includes(status)) {
        return res.status(400).json({ error: 'status must be ONLINE or OFFLINE' });
      }

      const driver = await driverService.update(driverId, {
        status: status as DriverStatus,
      });

      res.json(driver);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
