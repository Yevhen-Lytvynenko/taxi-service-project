import { Router, Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { getSocketService } from '../lib/socket';
import {
  bootstrap,
  createAndAssignOrder,
  setOrderSimulationStatus,
  setDriverOnlineLocation,
} from '../controllers/emulation.controller';

const router = Router();
const orderService = new OrderService();
const EMULATION_SECRET = process.env.EMULATION_SECRET || 'emulation_secret';

function checkEmulationSecret(req: Request, res: Response, next: () => void) {
  const secret = req.headers['x-emulation-secret'] as string;
  if (secret !== EMULATION_SECRET) {
    return res.status(403).json({ error: 'Invalid emulation secret' });
  }
  next();
}

router.use(checkEmulationSecret);

router.get('/bootstrap', bootstrap);

router.post('/orders/create-and-assign', createAndAssignOrder);

router.post('/orders/:id/simulation-status', setOrderSimulationStatus);

router.post('/drivers/:id/set-online-location', setDriverOnlineLocation);

router.post('/notify-order/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.findById(req.params.id as string);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    getSocketService().notifyAdminOrderUpdate(order);
    getSocketService().notifyOrderStatus(order.id, order.status);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
