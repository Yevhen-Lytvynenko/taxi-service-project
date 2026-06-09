import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOfficePermission } from '../middleware/permissions.middleware';

const router = Router();
const orderController = new OrderController();

router.post('/quote', authMiddleware, orderController.quote.bind(orderController));
router.post(
  '/dispatch',
  authMiddleware,
  requireOfficePermission('dispatch', 'write'),
  orderController.dispatchCreate.bind(orderController)
);
router.post('/', authMiddleware, orderController.create.bind(orderController));
router.get('/', authMiddleware, orderController.getAll.bind(orderController));
router.get('/:id', authMiddleware, orderController.getOne.bind(orderController));
router.put('/:id', authMiddleware, orderController.update.bind(orderController));
router.delete('/:id', authMiddleware, orderController.delete.bind(orderController));
router.put('/:id/route', authMiddleware, orderController.selectRoute.bind(orderController));
router.post('/:id/simulate', authMiddleware, orderController.simulate.bind(orderController));

export default router;