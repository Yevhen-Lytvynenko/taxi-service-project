import { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

import {
  type OfficePermissionKey,
  type PermLevel,
  defaultPermissionsForLegacyRole,
  levelMeets,
} from '../lib/officePermissions';
import type { JwtUserPayload } from '../types/jwt-user';
import { isOfficeRole } from './authorize.middleware';

function effectivePerm(user: JwtUserPayload, key: OfficePermissionKey): PermLevel {
  if (user.role === 'ADMIN') {
    return 'write';
  }
  const fromJwt = user.perms?.[key];
  if (fromJwt === 'none' || fromJwt === 'read' || fromJwt === 'write') {
    return fromJwt;
  }
  if (!isOfficeRole(user.role)) {
    return 'none';
  }
  return defaultPermissionsForLegacyRole(user.role as Role)[key];
}

/** Перевірка матриці дозволів офісу (JWT `perms` або дефолт за `role`). */
export function requireOfficePermission(key: OfficePermissionKey, min: 'read' | 'write') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isOfficeRole(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (!levelMeets(effectivePerm(req.user as JwtUserPayload, key), min)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
