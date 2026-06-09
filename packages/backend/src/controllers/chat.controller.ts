import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { assertOrderAccess } from '../lib/orderAccess';
import { isStaffRole } from '../middleware/authorize.middleware';
import { getSocketService } from '../lib/socket';
import { prisma } from '../lib/prisma';

const chatService = new ChatService();

const TRIP_CHAT_SEND_STATUSES = new Set(['ACCEPTED', 'ARRIVED', 'IN_PROGRESS']);

export class ChatController {
  async listForStaff(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !isStaffRole(user.role)) {
        return res.status(403).json({ error: 'Staff only' });
      }
      const limit = parseInt(String(req.query.limit ?? '300'), 10);
      const rows = await chatService.findRecentForStaff(Number.isFinite(limit) ? limit : 300);
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const orderId = req.body?.orderId ?? req.body?.order?.connect?.id;
      if (orderId) {
        await assertOrderAccess(String(orderId), user);
      }
      const chat = await chatService.create(req.body);
      res.status(201).json(chat);
    } catch (error: any) {
      const code = error.status === 403 ? 403 : error.status === 404 ? 404 : 400;
      res.status(code).json({ error: error.message });
    }
  }

  async getByOrder(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const orderId = req.params.orderId as string;
      await assertOrderAccess(orderId, user);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { driverId: true },
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (!order.driverId && !isStaffRole(user.role)) {
        return res.status(404).json({
          error: 'NO_DRIVER',
          message: 'Чат буде доступний після призначення водія',
        });
      }

      const chat = await chatService.ensureForOrder(orderId);
      res.json(chat);
    } catch (error: any) {
      const code = error.status === 403 ? 403 : error.status === 404 ? 404 : 500;
      res.status(code).json({ error: error.message });
    }
  }

  /** POST body: { "text": "..." } — повідомлення зберігаються в Chat.history як Json-масив. */
  async postMessageByOrder(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (isStaffRole(user.role)) {
        return res.status(403).json({ error: 'Staff cannot send trip chat messages' });
      }

      const orderId = req.params.orderId as string;
      await assertOrderAccess(orderId, user);

      const text = req.body?.text;
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'text must be a string' });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { driverId: true, status: true, clientId: true },
      });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (!order.driverId) {
        return res.status(400).json({ error: 'No driver assigned yet' });
      }
      if (!TRIP_CHAT_SEND_STATUSES.has(order.status)) {
        return res.status(400).json({
          error: 'Chat is closed for this order status',
        });
      }

      if (user.role === 'CLIENT' && user.id !== order.clientId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (user.role === 'DRIVER' && user.driverId !== order.driverId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const role = user.role === 'DRIVER' ? 'DRIVER' : 'CLIENT';
      const entry = chatService.buildMessage(role, text);

      const chat = await chatService.ensureForOrder(orderId);
      const updated = await chatService.addMessage(chat.id, entry);

      const history = updated.history;
      const historyLength = Array.isArray(history) ? history.length : 0;
      try {
        getSocketService().notifyOrderChatMessage(orderId, {
          message: entry,
          historyLength,
        });
      } catch {
        /* socket optional at startup tests */
      }

      res.json(updated);
    } catch (error: any) {
      const code =
        error.status === 403 ? 403 : error.status === 404 ? 404 : error.message?.includes('required') ? 400 : 400;
      res.status(code).json({ error: error.message });
    }
  }

  async addMessage(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (isStaffRole(user.role)) {
        return res.status(403).json({ error: 'Staff cannot send trip chat messages' });
      }

      const chat = await chatService.findById(req.params.id as string);
      if (!chat) return res.status(404).json({ error: 'Chat not found' });
      await assertOrderAccess(chat.orderId, user);

      const text = req.body?.text;
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'text must be a string' });
      }

      const order = await prisma.order.findUnique({
        where: { id: chat.orderId },
        select: { driverId: true, status: true, clientId: true },
      });
      if (!order?.driverId) {
        return res.status(400).json({ error: 'No driver assigned' });
      }
      if (!TRIP_CHAT_SEND_STATUSES.has(order.status)) {
        return res.status(400).json({ error: 'Chat is closed for this order status' });
      }

      if (user.role === 'CLIENT' && user.id !== order.clientId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (user.role === 'DRIVER' && user.driverId !== order.driverId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const role = user.role === 'DRIVER' ? 'DRIVER' : 'CLIENT';
      const entry = chatService.buildMessage(role, text);
      const updated = await chatService.addMessage(chat.id, entry);
      const history = updated.history;
      const historyLength = Array.isArray(history) ? history.length : 0;
      try {
        getSocketService().notifyOrderChatMessage(chat.orderId, {
          message: entry,
          historyLength,
        });
      } catch {
        /* ignore */
      }
      res.json(updated);
    } catch (error: any) {
      const code = error.status === 403 ? 403 : error.status === 404 ? 404 : 400;
      res.status(code).json({ error: error.message });
    }
  }
}
