import { Request, Response } from 'express';
import { ContactListKind } from '@prisma/client';
import { UserContactService } from '../services/userContact.service';

const service = new UserContactService();

function parseKind(raw: unknown): ContactListKind {
  const s = String(raw || '').toUpperCase();
  if (s === 'FAVORITE' || s === 'BLOCKED') return s as ContactListKind;
  throw new Error('kind must be FAVORITE or BLOCKED');
}

export class ContactsController {
  async list(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const kindQ = req.query.kind as string | undefined;
      const kind = kindQ ? parseKind(kindQ) : undefined;
      const rows = await service.list(userId, kind);
      res.json(rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async add(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { peerId, kind: kindRaw } = req.body as { peerId?: string; kind?: string };
      if (!peerId) return res.status(400).json({ error: 'peerId is required' });
      const kind = parseKind(kindRaw);
      const row = await service.add(userId, peerId, kind);
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const peerId = req.params.peerId as string;
      const kind = parseKind(req.query.kind);
      await service.remove(userId, peerId, kind);
      res.status(204).send();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
