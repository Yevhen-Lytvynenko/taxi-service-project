import { Request, Response } from 'express';
import { DriverService } from '../services/driver.service';

const driverService = new DriverService();

export class DriverController {
  async create(req: Request, res: Response) {
    try {
      const driver = await driverService.create(req.body);
      res.status(201).json(driver);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const withLocation = req.query.withLocation === '1' || req.query.withLocation === 'true';
      const drivers = await driverService.findAll(withLocation);
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const driver = await driverService.findById(req.params.id as string);
      if (!driver) return res.status(404).json({ error: 'Driver profile not found' });
      res.json(driver);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const driver = await driverService.update(req.params.id as string, req.body);
      res.json(driver);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await driverService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}