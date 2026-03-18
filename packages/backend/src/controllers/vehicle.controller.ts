import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';

const vehicleService = new VehicleService();

export class VehicleController {
  async create(req: Request, res: Response) {
    try {
      const vehicle = await vehicleService.create(req.body);
      res.status(201).json(vehicle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const vehicles = await vehicleService.findAll();
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const vehicle = await vehicleService.findById(req.params.id as string);
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const vehicle = await vehicleService.update(req.params.id as string, req.body);
      res.json(vehicle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await vehicleService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}