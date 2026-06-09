import { getSocketService } from '../lib/socket';
import { logger } from '../lib/logger';

import { prisma } from '../lib/prisma';

export function startSearchingOrderTimeoutWatcher(intervalMs = 15_000): () => void {
  const timer = setInterval(() => {
    void expireStaleSearchingOrders();
  }, intervalMs);
  void expireStaleSearchingOrders();
  return () => clearInterval(timer);
}

async function expireStaleSearchingOrders() {
  const now = new Date();
  try {
    const stale = await prisma.order.findMany({
      where: {
        status: 'SEARCHING',
        matchDeadlineAt: { lt: now },
      },
      select: { id: true },
    });
    if (stale.length === 0) return;

    for (const o of stale) {
      await prisma.order.update({
        where: { id: o.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'NO_DRIVERS_AVAILABLE',
          cancelledByRole: null,
        },
      });
      getSocketService().broadcastOrderCancelled(o.id);
      getSocketService().notifyOrderStatus(o.id, 'CANCELLED');
      logger.info({ orderId: o.id }, 'Order auto-cancelled: match deadline exceeded');
    }
  } catch (e) {
    logger.error({ err: e }, 'searchingTimeout job failed');
  }
}
