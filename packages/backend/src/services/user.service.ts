import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

type UpdateBody = Prisma.UserUpdateInput & { officeRoleId?: string | null };

export class UserService {
  async create(data: Prisma.UserCreateInput & { officeRoleId?: string | null }) {
    const officeRoleId =
      typeof (data as { officeRoleId?: string }).officeRoleId === 'string'
        ? (data as { officeRoleId?: string }).officeRoleId
        : undefined;
    const { officeRoleId: _omit, ...rest } = data as Prisma.UserCreateInput & { officeRoleId?: string };
    let createData: Prisma.UserCreateInput = { ...rest };

    if (officeRoleId) {
      const orole = await prisma.officeRole.findUnique({ where: { id: officeRoleId } });
      if (!orole) {
        throw new Error('Office role not found');
      }
      createData.role = orole.legacyRole;
      createData.officeRole = { connect: { id: officeRoleId } };
    }

    const hashedPassword = await bcrypt.hash(createData.password as string, 10);
    return prisma.user.create({
      data: {
        ...createData,
        password: hashedPassword,
      },
      include: {
        driverProfile: true,
        employeeProfile: true,
        officeRole: true,
      },
    });
  }

  async findAll() {
    return prisma.user.findMany({
      include: {
        driverProfile: true,
        employeeProfile: true,
        officeRole: true,
        clientOrders: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        driverProfile: true,
        employeeProfile: true,
        officeRole: true,
        clientOrders: true,
      },
    });
  }

  async update(id: string, data: UpdateBody) {
    const { officeRoleId, ...rest } = data;
    let patch: Prisma.UserUpdateInput = { ...rest };

    if (officeRoleId !== undefined) {
      if (officeRoleId === null || officeRoleId === '') {
        patch.officeRole = { disconnect: true };
      } else if (typeof officeRoleId === 'string') {
        const orole = await prisma.officeRole.findUnique({ where: { id: officeRoleId } });
        if (!orole) {
          throw new Error('Office role not found');
        }
        patch.role = orole.legacyRole;
        patch.officeRole = { connect: { id: officeRoleId } };
      }
    }

    if (patch.password && typeof patch.password === 'string') {
      patch.password = await bcrypt.hash(patch.password, 10);
    }
    return prisma.user.update({
      where: { id },
      data: patch,
      include: {
        driverProfile: true,
        employeeProfile: true,
        officeRole: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
