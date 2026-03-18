import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class DriverService {
  async create(data: Prisma.DriverProfileCreateInput) {
    return prisma.driverProfile.create({
      data,
      include: {
        user: true,
        vehicle: true
      }
    });
  }

  async findAll(withLocation = false) {
    const where = withLocation
      ? { currentLat: { not: null }, currentLng: { not: null } }
      : {};
    return prisma.driverProfile.findMany({
      where,
      include: {
        user: true,
        vehicle: true,
        driverOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.driverProfile.findUnique({
      where: { id },
      include: {
        user: true,
        vehicle: true,
        driverOrders: true,
        transactions: true,
        receivedReviews: true,
        locationLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });
  }

  async findByUserId(userId: string) {
    return prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        vehicle: true
      }
    });
  }

  async update(id: string, data: Prisma.DriverProfileUpdateInput) {
    return prisma.driverProfile.update({
      where: { id },
      data,
      include: {
        vehicle: true
      }
    });
  }

  async delete(id: string) {
    return prisma.driverProfile.delete({
      where: { id }
    });
  }
}