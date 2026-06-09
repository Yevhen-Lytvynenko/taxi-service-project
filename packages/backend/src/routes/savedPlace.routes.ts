import { Router } from 'express';
import { SavedPlaceController } from '../controllers/savedPlace.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const c = new SavedPlaceController();

router.use(authMiddleware);
router.get('/', c.listMine.bind(c));
router.post('/', c.createMine.bind(c));
router.put('/:id', c.updateMine.bind(c));
router.delete('/:id', c.deleteMine.bind(c));

export default router;
