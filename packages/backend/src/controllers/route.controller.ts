import { Request, Response } from 'express';
import { getRoute } from '../services/route.service';
import { getDrivingRouteAlternatives } from '../services/googleDirections.service';

function parseCoordsQuery(s: string): { lat: number; lng: number } | null {
  const parts = s.split(',');
  if (parts.length !== 2) return null;
  const p0 = parts[0];
  const p1 = parts[1];
  if (p0 == null || p1 == null) return null;
  const lat = parseFloat(p0.trim());
  const lng = parseFloat(p1.trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export class RouteController {
  async alternatives(req: Request, res: Response) {
    try {
      const fromStr = req.query.from as string;
      const toStr = req.query.to as string;

      if (!fromStr || !toStr) {
        return res.status(400).json({ error: 'from and to query params required (format: lat,lng)' });
      }

      const from = parseCoordsQuery(fromStr);
      const to = parseCoordsQuery(toStr);

      if (!from || !to) {
        return res
          .status(400)
          .json({ error: 'Invalid format. Use from=lat,lng&to=lat,lng' });
      }

      const result = await getDrivingRouteAlternatives(from, to);
      if (result.options.length === 0) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async route(req: Request, res: Response) {
    try {
      const fromStr = req.query.from as string;
      const toStr = req.query.to as string;

      if (!fromStr || !toStr) {
        return res.status(400).json({ error: 'from and to query params required (format: lat,lng)' });
      }

      const from = parseCoordsQuery(fromStr);
      const to = parseCoordsQuery(toStr);

      if (!from || !to) {
        return res
          .status(400)
          .json({ error: 'Invalid format. Use from=lat,lng&to=lat,lng' });
      }

      const result = await getRoute(from, to);

      if (!result) {
        return res.status(404).json({ error: 'Route not found' });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
