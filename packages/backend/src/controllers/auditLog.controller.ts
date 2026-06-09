import { Request, Response } from 'express';

import { prisma } from '../lib/prisma';

export class AuditLogController {
  async list(req: Request, res: Response) {
    try {
      const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400000);
      const to = req.query.to ? new Date(String(req.query.to)) : new Date();
      const limit = Math.min(Number(req.query.limit) || 200, 1000);
      const rows = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: from, lte: to },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, username: true, role: true } },
        },
      });
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
