import { Router } from 'express';
import { RouteController } from '../controllers/route.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const routeController = new RouteController();

router.use(authMiddleware);

router.get('/alternatives', routeController.alternatives.bind(routeController));
router.get('/', routeController.route.bind(routeController));

export default router;
