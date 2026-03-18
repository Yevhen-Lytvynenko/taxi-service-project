import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ReviewService {
  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({
      data,
      include: {
        author: true,
        driver: true
      }
    });
  }

  async findByDriverId(driverId: string) {
    return prisma.review.findMany({
      where: { driverId },
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: string) {
    return prisma.review.delete({
      where: { id }
    });
  }
}