import type { Request } from 'express';
import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/** Дозволяє `undefined` від `req.user?.id`, `clientIp(req)` тощо при exactOptionalPropertyTypes. */
export type AuditLogWriteInput = {
  userId?: string | null | undefined;
  action: string;
  entity?: string | null | undefined;
  entityId?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  ip?: string | null | undefined;
};

export function clientIp(req: Request): string | undefined {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0]?.trim();
  return req.socket?.remoteAddress ?? undefined;
}

export async function writeAuditLog(entry: AuditLogWriteInput) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    action: entry.action,
  };

  if (entry.userId !== undefined) data.userId = entry.userId;
  if (entry.entity !== undefined) data.entity = entry.entity;
  if (entry.entityId !== undefined) data.entityId = entry.entityId;
  if (entry.ip !== undefined) data.ip = entry.ip;
  if (entry.metadata != null) {
    data.metadata = entry.metadata as Prisma.InputJsonValue;
  }

  try {
    await prisma.auditLog.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      logger.warn(
        { table: e.meta?.table },
        'AuditLog: таблиця ще не створена в БД. Виконайте `npm run db:push -w packages/backend` (або `npx prisma migrate dev`).'
      );
      return;
    }
    logger.error({ err: e, action: entry.action }, 'writeAuditLog failed');
  }
}
