import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';

const router = Router();
const driverController = new DriverController();

router.post('/', driverController.create.bind(driverController));
router.get('/', driverController.getAll.bind(driverController));
router.get('/:id', driverController.getOne.bind(driverController));
router.put('/:id', driverController.update.bind(driverController));
router.delete('/:id', driverController.delete.bind(driverController));

export default router;