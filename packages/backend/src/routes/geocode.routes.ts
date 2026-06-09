import { Router } from 'express';
import { GeocodeController } from '../controllers/geocode.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const geocodeController = new GeocodeController();

router.use(authMiddleware);

router.get('/', geocodeController.geocode.bind(geocodeController));
router.get('/reverse', geocodeController.reverseGeocode.bind(geocodeController));

export default router;
