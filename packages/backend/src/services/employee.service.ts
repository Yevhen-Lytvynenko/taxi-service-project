import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class EmployeeService {
  async create(data: Prisma.EmployeeProfileCreateInput) {
    return prisma.employeeProfile.create({
      data,
      include: { user: true }
    });
  }

  async findAll() {
    return prisma.employeeProfile.findMany({
      include: { user: true }
    });
  }

  async update(id: string, data: Prisma.EmployeeProfileUpdateInput) {
    return prisma.employeeProfile.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.employeeProfile.delete({
      where: { id }
    });
  }
}