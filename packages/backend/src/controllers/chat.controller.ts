import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export class ChatController {
  async create(req: Request, res: Response) {
    try {
      const chat = await chatService.create(req.body);
      res.status(201).json(chat);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByOrder(req: Request, res: Response) {
    try {
      const chat = await chatService.findByOrderId(req.params.orderId as string);
      if (!chat) return res.status(404).json({ error: 'Chat not found' });
      res.json(chat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addMessage(req: Request, res: Response) {
    try {
      const chat = await chatService.addMessage(req.params.id as string, req.body);
      res.json(chat);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}