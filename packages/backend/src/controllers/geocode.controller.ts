import { Request, Response } from 'express';
import { geocodeAddress } from '../services/geocode.service';

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
}
