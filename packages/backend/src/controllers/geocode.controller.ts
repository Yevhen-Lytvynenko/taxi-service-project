import { Request, Response } from 'express';
import { geocodeAddress, reverseGeocode } from '../services/geocode.service';

export class GeocodeController {
  async geocode(req: Request, res: Response) {
    try {
      const address = req.query.address as string;
      if (!address) {
        return res.status(400).json({ error: 'address query param is required' });
      }
      const result = await geocodeAddress(address);
      if (!result) {
        return res.status(404).json({ error: 'Address not found' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async reverseGeocode(req: Request, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'lat and lng query params are required and must be numbers' });
      }
      const result = await reverseGeocode(lat, lng);
      if (!result) {
        return res.status(404).json({ error: 'Address not found for coordinates' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
