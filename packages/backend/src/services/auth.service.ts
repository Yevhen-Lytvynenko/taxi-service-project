import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { getJwtSecret } from '../config/env';

import { buildEffectivePermissions } from '../lib/officePermissions';
import { prisma } from '../lib/prisma';
import { isOfficeRole } from '../middleware/authorize.middleware';

const userForAuthInclude = {
  driverProfile: true,
  employeeProfile: true,
  officeRole: true,
} as const;

function jwtPayload(user: {
  id: string;
  role: Role;
  officeRoleId: string | null;
  driverProfile: { id: string } | null;
  officeRole: { legacyRole: Role; permissions: unknown } | null;
}) {
  const legacyForPerms = (user.officeRole?.legacyRole ?? user.role) as Role;
  const permsObj = isOfficeRole(user.role)
    ? legacyForPerms === 'ADMIN'
      ? buildEffectivePermissions('ADMIN', {})
      : buildEffectivePermissions(legacyForPerms, user.officeRole?.permissions)
    : null;
  const perms =
    permsObj &&
    (Object.fromEntries(
      Object.entries(permsObj) as [string, 'none' | 'read' | 'write'][]
    ) as Record<string, 'none' | 'read' | 'write'>);

  return {
    id: user.id,
    role: user.role,
    driverId: user.driverProfile?.id,
    officeRoleId: user.officeRoleId ?? undefined,
    ...(perms ? { perms } : {}),
  };
}

export class AuthService {
  async login(phone: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: userForAuthInclude,
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(jwtPayload(user), getJwtSecret(), { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async loginByUsername(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: userForAuthInclude,
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(jwtPayload(user), getJwtSecret(), { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: userForAuthInclude,
    });

    if (!user) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePushToken(userId: string, pushToken: string | null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken: pushToken || null },
      include: userForAuthInclude,
    });
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
