import { Request, Response } from 'express';
import { TariffService } from '../services/tariff.service';

const tariffService = new TariffService();

export class TariffController {
  async create(req: Request, res: Response) {
    try {
      const tariff = await tariffService.create(req.body);
      res.status(201).json(tariff);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const tariffs = await tariffService.findAll();
      res.json(tariffs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const tariff = await tariffService.findById(req.params.id as string);
      if (!tariff) return res.status(404).json({ error: 'Tariff not found' });
      res.json(tariff);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const tariff = await tariffService.update(req.params.id as string, req.body);
      res.json(tariff);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await tariffService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}