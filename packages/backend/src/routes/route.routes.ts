import { Router } from 'express';
import { RouteController } from '../controllers/route.controller';

const router = Router();
const routeController = new RouteController();

router.get('/', routeController.route.bind(routeController));

export default router;
