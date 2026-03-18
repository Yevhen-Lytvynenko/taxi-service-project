import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const transactionController = new TransactionController();

router.post('/', transactionController.create.bind(transactionController));
router.get('/', transactionController.getAll.bind(transactionController));
router.get('/driver/:driverId', transactionController.getByDriver.bind(transactionController));
router.get('/:id', transactionController.getOne.bind(transactionController));

export default router;