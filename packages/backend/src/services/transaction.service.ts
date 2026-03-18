import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionService {
  async create(data: Prisma.TransactionCreateInput) {
    return prisma.transaction.create({
      data,
      include: {
        driver: true,
        order: true
      }
    });
  }

  async findAll() {
    return prisma.transaction.findMany({
      include: {
        driver: true,
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByDriverId(driverId: string) {
    return prisma.transaction.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        driver: true,
        order: true
      }
    });
  }
}