import { Router } from 'express';
import { TariffController } from '../controllers/tariff.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();
const tariffController = new TariffController();

router.get('/', authMiddleware, tariffController.getAll.bind(tariffController));
router.get('/:id', authMiddleware, tariffController.getOne.bind(tariffController));

router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'ACCOUNTANT']), tariffController.create.bind(tariffController));
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'ACCOUNTANT']), tariffController.update.bind(tariffController));
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'ACCOUNTANT']), tariffController.delete.bind(tariffController));

export default router;
