import { isOfficeRole } from '../middleware/authorize.middleware';
import type { JwtUserPayload } from '../types/jwt-user';

import { prisma } from './prisma';

/** Перегляд замовлення: будь-який офіс, клієнт або водій по призначенню. */
export async function assertOrderAccess(orderId: string, user: JwtUserPayload): Promise<void> {
  if (isOfficeRole(user.role)) {
    return;
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { clientId: true, driverId: true },
  });
  if (!order) {
    const e = new Error('Order not found');
    (e as any).status = 404;
    throw e;
  }
  if (user.role === 'CLIENT' && order.clientId === user.id) {
    return;
  }
  if (user.role === 'DRIVER' && order.driverId && order.driverId === user.driverId) {
    return;
  }
  const e = new Error('Forbidden');
  (e as any).status = 403;
  throw e;
}
