import { ContactListKind, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class UserContactService {
  async list(ownerId: string, kind?: ContactListKind) {
    const where: Prisma.UserContactWhereInput = { ownerId };
    if (kind) where.kind = kind;
    return prisma.userContact.findMany({
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

  async add(ownerId: string, peerId: string, kind: ContactListKind) {
    if (ownerId === peerId) {
      throw new Error('Неможливо додати себе');
    }
    const peer = await prisma.user.findUnique({ where: { id: peerId }, select: { id: true } });
    if (!peer) throw new Error('Користувача не знайдено');

    return prisma.userContact.upsert({
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

  async remove(ownerId: string, peerId: string, kind: ContactListKind) {
    await prisma.userContact.deleteMany({ where: { ownerId, peerId, kind } });
  }

  /** Профілі водіїв, яких не варто залучати до замовлення клієнта. */
  async getExcludedDriverProfileIdsForClient(clientUserId: string): Promise<Set<string>> {
    const excluded = new Set<string>();

    const clientBlocked = await prisma.userContact.findMany({
      where: { ownerId: clientUserId, kind: 'BLOCKED' },
      select: { peerId: true },
    });
    const peerIdsFromClient = clientBlocked.map((c) => c.peerId);

    const blockedClientSide = await prisma.userContact.findMany({
      where: { peerId: clientUserId, kind: 'BLOCKED' },
      select: { ownerId: true },
    });
    const ownerIds = [...peerIdsFromClient, ...blockedClientSide.map((c) => c.ownerId)];

    if (ownerIds.length === 0) return excluded;

    const profiles = await prisma.driverProfile.findMany({
      where: { userId: { in: ownerIds } },
      select: { id: true },
    });
    for (const p of profiles) excluded.add(p.id);
    return excluded;
  }
}
