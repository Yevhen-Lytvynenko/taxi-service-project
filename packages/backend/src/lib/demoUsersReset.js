"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_SHOWCASE_DRIVER_PHONE = exports.DEMO_SHOWCASE_CLIENT_PHONE = void 0;
exports.resetPresentationDemoUsers = resetPresentationDemoUsers;
exports.isDemoResetOnStartEnabled = isDemoResetOnStartEnabled;
/** Демо для презентації: один клієнт + один водій (логін/пароль див. seed). */
exports.DEMO_SHOWCASE_CLIENT_PHONE = '+380991111111';
exports.DEMO_SHOWCASE_DRIVER_PHONE = '+380992222222';
/**
 * Очищає історію замовлень, відгуків, чатів, транзакцій і треків для демо-пари;
 * скидає рейтинги на 5.0 і баланс водія на 0.
 * Викликати після seed або при старті бекенду (DEMO_RESET_ON_START).
 */
async function resetPresentationDemoUsers(db) {
    const clientUser = await db.user.findUnique({
        where: { phone: exports.DEMO_SHOWCASE_CLIENT_PHONE },
    });
    const driverUser = await db.user.findUnique({
        where: { phone: exports.DEMO_SHOWCASE_DRIVER_PHONE },
        include: { driverProfile: true },
    });
    if (!clientUser || !driverUser?.driverProfile) {
        return;
    }
    const profileId = driverUser.driverProfile.id;
    const demoUserIds = [clientUser.id, driverUser.id];
    const orders = await db.order.findMany({
        where: {
            OR: [{ clientId: clientUser.id }, { driverId: profileId }],
        },
        select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);
    await db.review.deleteMany({
        where: {
            OR: [
                { authorId: { in: demoUserIds } },
                { subjectUserId: { in: demoUserIds } },
                ...(orderIds.length ? [{ orderId: { in: orderIds } }] : []),
            ],
        },
    });
    if (orderIds.length) {
        await db.chat.deleteMany({ where: { orderId: { in: orderIds } } });
    }
    await db.transaction.deleteMany({
        where: {
            OR: [{ driverId: profileId }, ...(orderIds.length ? [{ orderId: { in: orderIds } }] : [])],
        },
    });
    await db.locationLog.deleteMany({
        where: {
            OR: [{ driverId: profileId }, ...(orderIds.length ? [{ orderId: { in: orderIds } }] : [])],
        },
    });
    await db.userContact.deleteMany({
        where: {
            OR: [{ ownerId: { in: demoUserIds } }, { peerId: { in: demoUserIds } }],
        },
    });
    await db.order.deleteMany({
        where: {
            OR: [{ clientId: clientUser.id }, { driverId: profileId }],
        },
    });
    await db.user.updateMany({
        where: { id: { in: demoUserIds } },
        data: { rating: 5.0 },
    });
    await db.driverProfile.update({
        where: { id: profileId },
        data: {
            balance: 0,
            status: 'OFFLINE',
        },
    });
}
function isDemoResetOnStartEnabled() {
    const v = process.env.DEMO_RESET_ON_START?.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
}
//# sourceMappingURL=demoUsersReset.js.map