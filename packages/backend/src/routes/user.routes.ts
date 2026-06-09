import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { requireOperationsStaff, requireSelfOrStaff } from '../middleware/authorize.middleware';

const router = Router();
const userController = new UserController();

router.post('/', authMiddleware, roleMiddleware(['ADMIN']), userController.create.bind(userController));
router.get('/', authMiddleware, requireOperationsStaff, userController.getAll.bind(userController));
router.get('/:id', authMiddleware, requireSelfOrStaff(), userController.getOne.bind(userController));
router.put('/:id', authMiddleware, requireSelfOrStaff(), userController.update.bind(userController));
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), userController.delete.bind(userController));

export default router;
