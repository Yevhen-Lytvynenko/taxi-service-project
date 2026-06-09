"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserContactService = void 0;
const prisma_1 = require("../lib/prisma");
class UserContactService {
    async list(ownerId, kind) {
        const where = { ownerId };
        if (kind)
            where.kind = kind;
        return prisma_1.prisma.userContact.findMany({
            where,
            include: {
                peer: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        rating: true,
                        role: true,
                        driverProfile: { select: { id: true, vehicle: { select: { model: true, plateNumber: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async add(ownerId, peerId, kind) {
        if (ownerId === peerId) {
            throw new Error('Неможливо додати себе');
        }
        const peer = await prisma_1.prisma.user.findUnique({ where: { id: peerId }, select: { id: true } });
        if (!peer)
            throw new Error('Користувача не знайдено');
        return prisma_1.prisma.userContact.upsert({
            where: {
                ownerId_peerId_kind: { ownerId, peerId, kind },
            },
            create: { ownerId, peerId, kind },
            update: {},
            include: {
                peer: {
                    select: { id: true, fullName: true, phone: true, rating: true, role: true },
                },
            },
        });
    }
    async remove(ownerId, peerId, kind) {
        await prisma_1.prisma.userContact.deleteMany({ where: { ownerId, peerId, kind } });
    }
    /** Профілі водіїв, яких не варто залучати до замовлення клієнта. */
    async getExcludedDriverProfileIdsForClient(clientUserId) {
        const excluded = new Set();
        const clientBlocked = await prisma_1.prisma.userContact.findMany({
            where: { ownerId: clientUserId, kind: 'BLOCKED' },
            select: { peerId: true },
        });
        const peerIdsFromClient = clientBlocked.map((c) => c.peerId);
        const blockedClientSide = await prisma_1.prisma.userContact.findMany({
            where: { peerId: clientUserId, kind: 'BLOCKED' },
            select: { ownerId: true },
        });
        const ownerIds = [...peerIdsFromClient, ...blockedClientSide.map((c) => c.ownerId)];
        if (ownerIds.length === 0)
            return excluded;
        const profiles = await prisma_1.prisma.driverProfile.findMany({
            where: { userId: { in: ownerIds } },
            select: { id: true },
        });
        for (const p of profiles)
            excluded.add(p.id);
        return excluded;
    }
}
exports.UserContactService = UserContactService;
//# sourceMappingURL=userContact.service.js.map