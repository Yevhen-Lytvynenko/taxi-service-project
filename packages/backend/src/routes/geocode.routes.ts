import { Router } from 'express';
import { GeocodeController } from '../controllers/geocode.controller';

const router = Router();
const geocodeController = new GeocodeController();

router.get('/', geocodeController.geocode.bind(geocodeController));

export default router;
