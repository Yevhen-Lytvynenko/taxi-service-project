import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const locationController = new LocationController();

router.use(authMiddleware);

router.get('/recent', locationController.listRecent.bind(locationController));
router.post('/', locationController.create.bind(locationController));
router.get('/history', locationController.getHistory.bind(locationController));
router.get('/heatmap', locationController.getHeatmap.bind(locationController));

export default router;
