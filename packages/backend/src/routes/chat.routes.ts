import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();
const chatController = new ChatController();

router.post('/', chatController.create.bind(chatController));
router.get('/order/:orderId', chatController.getByOrder.bind(chatController));
router.post('/:id/message', chatController.addMessage.bind(chatController));

export default router;