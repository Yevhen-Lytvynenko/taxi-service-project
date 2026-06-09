import { Request, Response } from 'express';
import { createPaymentIntentForOrder } from '../services/payment.service';

export class PaymentController {
  async createIntent(req: Request, res: Response) {
    try {
      const orderId = req.body.orderId as string;
      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }
      const result = await createPaymentIntentForOrder(orderId);
      res.json(result);
    } catch (e: any) {
      const status = e.message === 'Order not found' ? 404 : 400;
      res.status(status).json({ error: e.message });
    }
  }
}
