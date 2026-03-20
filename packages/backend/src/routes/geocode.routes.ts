import { Router } from 'express';
import { GeocodeController } from '../controllers/geocode.controller';

const router = Router();
const geocodeController = new GeocodeController();

router.get('/', geocodeController.geocode.bind(geocodeController));
router.get('/reverse', geocodeController.reverseGeocode.bind(geocodeController));

export default router;
