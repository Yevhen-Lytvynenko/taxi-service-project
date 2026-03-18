import { Router } from 'express';
import { TariffController } from '../controllers/tariff.controller';

const router = Router();
const tariffController = new TariffController();

router.post('/', tariffController.create.bind(tariffController));
router.get('/', tariffController.getAll.bind(tariffController));
router.get('/:id', tariffController.getOne.bind(tariffController));
router.put('/:id', tariffController.update.bind(tariffController));
router.delete('/:id', tariffController.delete.bind(tariffController));

export default router;