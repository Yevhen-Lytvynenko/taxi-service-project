import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class VehicleService {
  async create(data: Prisma.VehicleCreateInput) {
    return prisma.vehicle.create({
      data,
      include: {
        driver: true
      }
    });
  }

  async findAll() {
    return prisma.vehicle.findMany({
      include: {
        driver: {
          include: { user: true }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: { include: { user: true } },
      },
    });
  }

  async update(id: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.vehicle.delete({
      where: { id }
    });
  }
}