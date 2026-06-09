import type { Role } from '@prisma/client';
import { Request, Response } from 'express';

import { prisma } from '../lib/prisma';

const STAFF_LEGACY: Role[] = ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'];

function slugifyBase(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-')
    .replace(/^-|-$/g, '');
}

export class OfficeRoleController {
  async list(_req: Request, res: Response) {
    try {
      const rows = await prisma.officeRole.findMany({ orderBy: { displayName: 'asc' } });
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { displayName, legacyRole, permissions, slug: slugRaw } = req.body as {
        displayName?: unknown;
        legacyRole?: unknown;
        permissions?: unknown;
        slug?: unknown;
      };
      if (typeof displayName !== 'string' || !displayName.trim()) {
        return res.status(400).json({ error: 'displayName is required' });
      }
      if (typeof legacyRole !== 'string' || !STAFF_LEGACY.includes(legacyRole as Role)) {
        return res.status(400).json({ error: 'legacyRole must be a staff Role' });
      }
      let slug =
        typeof slugRaw === 'string' && slugRaw.trim() ? slugRaw.trim() : slugifyBase(displayName);
      if (!slug) slug = `role-${Date.now().toString(36)}`;
      let trySlug = slug;
      for (let i = 0; i < 20; i++) {
        const clash = await prisma.officeRole.findUnique({ where: { slug: trySlug } });
        if (!clash) break;
        trySlug = `${slug}-${Date.now().toString(36)}`;
      }
      const row = await prisma.officeRole.create({
        data: {
          slug: trySlug,
          displayName: displayName.trim(),
          legacyRole: legacyRole as Role,
          isSystem: false,
          permissions:
            permissions && typeof permissions === 'object' ? (permissions as object) : {},
        },
      });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async patch(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const existing = await prisma.officeRole.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      const { displayName, permissions } = req.body as { displayName?: unknown; permissions?: unknown };
      const data: {
        displayName?: string;
        permissions?: object;
      } = {};
      if (typeof displayName === 'string' && displayName.trim()) {
        data.displayName = displayName.trim();
      }
      if (permissions && typeof permissions === 'object') {
        data.permissions = permissions as object;
      }
      const row = await prisma.officeRole.update({ where: { id }, data });
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const existing = await prisma.officeRole.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (existing.isSystem) {
        return res.status(400).json({ error: 'Cannot delete system role' });
      }
      const cnt = await prisma.user.count({ where: { officeRoleId: id } });
      if (cnt > 0) {
        return res.status(400).json({ error: 'Role is assigned to users' });
      }
      await prisma.officeRole.delete({ where: { id } });
      res.status(204).send();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
