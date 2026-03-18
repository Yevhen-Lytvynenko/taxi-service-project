import { Request, Response } from 'express';
import { DriverService } from '../services/driver.service';
import { DriverStatus } from '@prisma/client';

const driverService = new DriverService();

export class DriverSelfController {
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
