import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

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