import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  requireDriverSelfOrStaff,
  requireOfficeStaff,
  requireOperationsStaff,
} from '../middleware/authorize.middleware';

const router = Router();
const driverController = new DriverController();

router.use(authMiddleware);

router.post('/', requireOperationsStaff, driverController.create.bind(driverController));
router.get('/', requireOfficeStaff, driverController.getAll.bind(driverController));
router.get('/:id', requireDriverSelfOrStaff(), driverController.getOne.bind(driverController));
router.put('/:id', requireOperationsStaff, driverController.update.bind(driverController));
router.delete('/:id', requireOperationsStaff, driverController.delete.bind(driverController));

export default router;
