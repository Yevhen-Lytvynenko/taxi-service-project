import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class TariffService {
  async create(data: Prisma.TariffCreateInput) {
    return prisma.tariff.create({
      data
    });
  }

  async findAll() {
    return prisma.tariff.findMany();
  }

  async findById(id: string) {
    return prisma.tariff.findUnique({
      where: { id }
    });
  }

  async findByName(name: any) {
    return prisma.tariff.findUnique({
      where: { name }
    });
  }

  async update(id: string, data: Prisma.TariffUpdateInput) {
    return prisma.tariff.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.tariff.delete({
      where: { id }
    });
  }
}