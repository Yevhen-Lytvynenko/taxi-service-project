import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();
const locationController = new LocationController();

router.post('/', locationController.create.bind(locationController));
router.get('/history', locationController.getHistory.bind(locationController));
router.get('/heatmap', locationController.getHeatmap.bind(locationController));

export default router;