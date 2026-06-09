"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSearchingOrderTimeoutWatcher = startSearchingOrderTimeoutWatcher;
const socket_1 = require("../lib/socket");
const logger_1 = require("../lib/logger");
const prisma_1 = require("../lib/prisma");
function startSearchingOrderTimeoutWatcher(intervalMs = 15_000) {
    const timer = setInterval(() => {
        void expireStaleSearchingOrders();
    }, intervalMs);
    void expireStaleSearchingOrders();
    return () => clearInterval(timer);
}
async function expireStaleSearchingOrders() {
    const now = new Date();
    try {
        const stale = await prisma_1.prisma.order.findMany({
            where: {
                status: 'SEARCHING',
                matchDeadlineAt: { lt: now },
            },
            select: { id: true },
        });
        if (stale.length === 0)
            return;
        for (const o of stale) {
            await prisma_1.prisma.order.update({
                where: { id: o.id },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: 'NO_DRIVERS_AVAILABLE',
                    cancelledByRole: null,
                },
            });
            (0, socket_1.getSocketService)().broadcastOrderCancelled(o.id);
            (0, socket_1.getSocketService)().notifyOrderStatus(o.id, 'CANCELLED');
            logger_1.logger.info({ orderId: o.id }, 'Order auto-cancelled: match deadline exceeded');
        }
    }
    catch (e) {
        logger_1.logger.error({ err: e }, 'searchingTimeout job failed');
    }
}
//# sourceMappingURL=searchingTimeout.job.js.map