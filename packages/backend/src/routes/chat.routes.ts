import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOperationsStaff } from '../middleware/authorize.middleware';

const router = Router();
const chatController = new ChatController();

router.use(authMiddleware);

router.get('/', requireOperationsStaff, chatController.listForStaff.bind(chatController));
router.post('/', chatController.create.bind(chatController));
router.get('/order/:orderId', chatController.getByOrder.bind(chatController));
router.post('/order/:orderId/messages', chatController.postMessageByOrder.bind(chatController));
router.post('/:id/message', chatController.addMessage.bind(chatController));

export default router;
