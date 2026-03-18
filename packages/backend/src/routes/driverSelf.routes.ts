import { Router } from 'express';
import { DriverSelfController } from '../controllers/driverSelf.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new DriverSelfController();

router.patch(
  '/me/status',
  authMiddleware,
  roleMiddleware(['DRIVER']),
  controller.updateStatus.bind(controller)
);

export default router;
