import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';

const locationService = new LocationService();

export class LocationController {
  async create(req: Request, res: Response) {
    try {
      const log = await locationService.create(req.body);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const { driverId, from, to } = req.query;
      const history = await locationService.getDriverHistory(
        String(driverId),
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