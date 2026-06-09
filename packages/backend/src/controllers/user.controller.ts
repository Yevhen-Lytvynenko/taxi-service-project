import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { isOperationsRole } from '../middleware/authorize.middleware';
import { clientIp, writeAuditLog } from '../services/audit.service';

const userService = new UserService();

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const user = await userService.create(req.body);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const user = await userService.findById(req.params.id as string);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const actor = req.user;
      const targetId = req.params.id as string;
      let body = { ...req.body } as Record<string, unknown>;

      if (actor && !isOperationsRole(actor.role) && actor.id === targetId) {
        const next: Record<string, unknown> = {};
        if (typeof body.fullName === 'string') next.fullName = body.fullName.trim();
        if (body.email === null || body.email === '') next.email = null;
        else if (typeof body.email === 'string') next.email = body.email.trim() || null;
        if (body.avatarUrl === null || body.avatarUrl === '') next.avatarUrl = null;
        else if (typeof body.avatarUrl === 'string') {
          if (body.avatarUrl.length > 400_000) {
            return res.status(400).json({ error: 'Зображення профілю занадто велике' });
          }
          next.avatarUrl = body.avatarUrl;
        }
        body = next;
      } else if (actor && !isOperationsRole(actor.role) && actor.id !== targetId) {
        return res.status(403).json({ error: 'Forbidden' });
      } else if (actor && isOperationsRole(actor.role)) {
        if (actor.role !== 'ADMIN' && 'officeRoleId' in body) {
          delete body.officeRoleId;
        }
        if (typeof body.avatarUrl === 'string' && body.avatarUrl.length > 400_000) {
          return res.status(400).json({ error: 'Зображення профілю занадто велике' });
        }
      }

      const user = await userService.update(targetId, body as any);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const targetId = req.params.id as string;
      await userService.delete(targetId);
      void writeAuditLog({
        userId: req.user?.id,
        action: 'USER_DELETE',
        entity: 'User',
        entityId: targetId,
        ip: clientIp(req),
      });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}