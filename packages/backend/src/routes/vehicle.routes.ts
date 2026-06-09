import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOfficeStaff, requireOperationsStaff } from '../middleware/authorize.middleware';

const router = Router();
const vehicleController = new VehicleController();

router.use(authMiddleware);

router.post('/', requireOperationsStaff, vehicleController.create.bind(vehicleController));
router.get('/', requireOfficeStaff, vehicleController.getAll.bind(vehicleController));
router.get('/:id', vehicleController.getOne.bind(vehicleController));
router.put('/:id', requireOperationsStaff, vehicleController.update.bind(vehicleController));
router.delete('/:id', requireOperationsStaff, vehicleController.delete.bind(vehicleController));

export default router;
