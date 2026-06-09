import { Request, Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';

const bodySchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

export class SavedPlaceController {
  async listMine(req: Request, res: Response) {
    try {
      const uid = req.user?.id;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const rows = await prisma.savedPlace.findMany({
        where: { userId: uid },
        orderBy: { createdAt: 'desc' },
      });
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async createMine(req: Request, res: Response) {
    try {
      const uid = req.user?.id;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const row = await prisma.savedPlace.create({
        data: { userId: uid, ...parsed.data },
      });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async updateMine(req: Request, res: Response) {
    try {
      const uid = req.user?.id;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const id = req.params.id as string;
      const parsed = bodySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const existing = await prisma.savedPlace.findFirst({ where: { id, userId: uid } });
      if (!existing) return res.status(404).json({ error: 'Not found' });
      const p = parsed.data;
      const data: Prisma.SavedPlaceUpdateInput = {};
      if (p.label !== undefined) data.label = p.label;
      if (p.address !== undefined) data.address = p.address;
      if (p.lat !== undefined) data.lat = p.lat;
      if (p.lng !== undefined) data.lng = p.lng;
      const row = await prisma.savedPlace.update({
        where: { id },
        data,
      });
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async deleteMine(req: Request, res: Response) {
    try {
      const uid = req.user?.id;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      const id = req.params.id as string;
      const existing = await prisma.savedPlace.findFirst({ where: { id, userId: uid } });
      if (!existing) return res.status(404).json({ error: 'Not found' });
      await prisma.savedPlace.delete({ where: { id } });
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
