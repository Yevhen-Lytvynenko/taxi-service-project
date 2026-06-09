import { Request, Response } from 'express';
import { TariffService } from '../services/tariff.service';
import { clientIp, writeAuditLog } from '../services/audit.service';

const tariffService = new TariffService();

export class TariffController {
  async create(req: Request, res: Response) {
    try {
      const tariff = await tariffService.create(req.body);
      void writeAuditLog({
        userId: req.user?.id,
        action: 'TARIFF_CREATE',
        entity: 'Tariff',
        entityId: tariff.id,
        metadata: { name: tariff.name },
        ip: clientIp(req),
      });
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
      const id = req.params.id as string;
      const tariff = await tariffService.update(id, req.body);
      void writeAuditLog({
        userId: req.user?.id,
        action: 'TARIFF_UPDATE',
        entity: 'Tariff',
        entityId: id,
        ip: clientIp(req),
      });
      res.json(tariff);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await tariffService.delete(id);
      void writeAuditLog({
        userId: req.user?.id,
        action: 'TARIFF_DELETE',
        entity: 'Tariff',
        entityId: id,
        ip: clientIp(req),
      });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}