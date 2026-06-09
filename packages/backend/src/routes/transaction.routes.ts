import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireFinanceStaff, requireFinanceStaffOrOwnDriver } from '../middleware/authorize.middleware';

const router = Router();
const transactionController = new TransactionController();

router.use(authMiddleware);

router.post('/', requireFinanceStaff, transactionController.create.bind(transactionController));
router.get('/', requireFinanceStaff, transactionController.getAll.bind(transactionController));
router.get(
  '/driver/:driverId',
  requireFinanceStaffOrOwnDriver('driverId'),
  transactionController.getByDriver.bind(transactionController)
);
router.get('/:id', requireFinanceStaff, transactionController.getOne.bind(transactionController));

export default router;
