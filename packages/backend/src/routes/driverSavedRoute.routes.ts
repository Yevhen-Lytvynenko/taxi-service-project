import { Router } from 'express';
import { SavedDriverRouteController } from '../controllers/savedDriverRoute.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();
const c = new SavedDriverRouteController();

router.use(authMiddleware, roleMiddleware(['DRIVER']));
router.get('/', c.listMine.bind(c));
router.post('/', c.createMine.bind(c));
router.put('/:id', c.updateMine.bind(c));
router.delete('/:id', c.deleteMine.bind(c));

export default router;
