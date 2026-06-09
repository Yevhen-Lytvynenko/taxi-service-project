import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const c = new PaymentController();

router.post('/create-intent', authMiddleware, c.createIntent.bind(c));

export default router;
