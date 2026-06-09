import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOperationsStaff } from '../middleware/authorize.middleware';

const router = Router();
const c = new ComplaintController();

router.post('/', authMiddleware, c.create.bind(c));
router.get('/', authMiddleware, requireOperationsStaff, c.listStaff.bind(c));
router.patch('/:id/status', authMiddleware, requireOperationsStaff, c.updateStatus.bind(c));

export default router;
