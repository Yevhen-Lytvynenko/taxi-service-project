import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';

const router = Router();
const vehicleController = new VehicleController();

router.post('/', vehicleController.create.bind(vehicleController));
router.get('/', vehicleController.getAll.bind(vehicleController));
router.get('/:id', vehicleController.getOne.bind(vehicleController));
router.put('/:id', vehicleController.update.bind(vehicleController));
router.delete('/:id', vehicleController.delete.bind(vehicleController));

export default router;