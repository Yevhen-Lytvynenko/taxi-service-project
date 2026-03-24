import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const orderController = new OrderController();

router.post('/', authMiddleware, orderController.create.bind(orderController));
router.get('/', orderController.getAll.bind(orderController));
router.get('/:id', orderController.getOne.bind(orderController));
router.put('/:id', authMiddleware, orderController.update.bind(orderController));
router.delete('/:id', orderController.delete.bind(orderController));
router.post('/:id/simulate', authMiddleware, orderController.simulate.bind(orderController));

export default router;