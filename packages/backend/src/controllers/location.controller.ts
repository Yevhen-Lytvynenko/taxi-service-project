import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { isOperationsRole } from '../middleware/authorize.middleware';

const locationService = new LocationService();

export class LocationController {
  async listRecent(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !isOperationsRole(user.role)) {
        return res.status(403).json({ error: 'Staff only' });
      }
      const limit = parseInt(String(req.query.limit ?? '2000'), 10);
      const history = await locationService.getRecentLogs(Number.isFinite(limit) ? limit : 2000);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const driverId = req.body?.driverId ?? req.body?.driver?.connect?.id;
      if (driverId && !isOperationsRole(user.role)) {
        if (user.role !== 'DRIVER' || user.driverId !== driverId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      } else if (!driverId && !isOperationsRole(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const log = await locationService.create(req.body);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const { driverId, from, to } = req.query;
      const did = String(driverId);
      if (!isOperationsRole(user.role)) {
        if (user.role !== 'DRIVER' || user.driverId !== did) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      const history = await locationService.getDriverHistory(
        did,
        new Date(String(from)),
        new Date(String(to))
      );
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHeatmap(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !isOperationsRole(user.role)) {
        return res.status(403).json({ error: 'Staff only' });
      }
      const { from, to, type } = req.query;
      const fromDate = from ? new Date(String(from)) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(String(to)) : new Date();
      const heatmapType = (type as 'pickup' | 'dropoff' | 'both') ?? 'both';
      if (!['pickup', 'dropoff', 'both'].includes(heatmapType)) {
        return res.status(400).json({ error: 'Invalid type. Use pickup, dropoff, or both' });
      }
      const data = await locationService.getHeatmapData(fromDate, toDate, heatmapType);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}