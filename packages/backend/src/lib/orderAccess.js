"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertOrderAccess = assertOrderAccess;
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const prisma_1 = require("./prisma");
/** Перегляд замовлення: будь-який офіс, клієнт або водій по призначенню. */
async function assertOrderAccess(orderId, user) {
    if ((0, authorize_middleware_1.isOfficeRole)(user.role)) {
        return;
    }
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        select: { clientId: true, driverId: true },
    });
    if (!order) {
        const e = new Error('Order not found');
        e.status = 404;
        throw e;
    }
    if (user.role === 'CLIENT' && order.clientId === user.id) {
        return;
    }
    if (user.role === 'DRIVER' && order.driverId && order.driverId === user.driverId) {
        return;
    }
    const e = new Error('Forbidden');
    e.status = 403;
    throw e;
}
//# sourceMappingURL=orderAccess.js.map