import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/register/driver', authController.registerDriver.bind(authController));
router.get('/me', authMiddleware, authController.getMe.bind(authController));
router.patch(
  '/me/push-token',
  authMiddleware,
  authController.updatePushToken.bind(authController)
);

export default router;