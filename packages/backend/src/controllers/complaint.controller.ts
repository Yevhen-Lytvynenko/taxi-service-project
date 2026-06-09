import { Request, Response } from 'express';
import { z } from 'zod';
import { ComplaintStatus } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { assertOrderAccess } from '../lib/orderAccess';

const createSchema = z.object({
  orderId: z.string().min(1).optional(),
  subjectText: z.string().min(3),
});

export class ComplaintController {
  async create(req: Request, res: Response) {
    try {
      const uid = req.user?.id;
      if (!uid || req.user?.role !== 'CLIENT') {
        return res.status(403).json({ error: 'Clients only' });
      }
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { orderId, subjectText } = parsed.data;
      if (orderId) {
        await assertOrderAccess(orderId, req.user!);
      }
      const row = await prisma.complaint.create({
        data: {
          orderId: orderId ?? null,
          authorClientId: uid,
          subjectText,
        },
      });
      res.status(201).json(row);
    } catch (e: any) {
      const code = e.status === 404 ? 404 : e.status === 403 ? 403 : 400;
      res.status(code).json({ error: e.message });
    }
  }

  async listStaff(req: Request, res: Response) {
    try {
      const from = req.query.from ? new Date(String(req.query.from)) : undefined;
      const to = req.query.to ? new Date(String(req.query.to)) : undefined;
      const status = req.query.status as ComplaintStatus | undefined;
      const rows = await prisma.complaint.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          author: { select: { id: true, fullName: true, phone: true } },
          order: { select: { id: true, status: true, pickupAddress: true, dropoffAddress: true } },
        },
      });
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const status = req.body?.status as ComplaintStatus | undefined;
      if (!status || !Object.values(ComplaintStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const row = await prisma.complaint.update({
        where: { id },
        data: { status },
      });
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
