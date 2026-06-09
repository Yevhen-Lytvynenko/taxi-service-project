"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const chatController = new chat_controller_1.ChatController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', authorize_middleware_1.requireOperationsStaff, chatController.listForStaff.bind(chatController));
router.post('/', chatController.create.bind(chatController));
router.get('/order/:orderId', chatController.getByOrder.bind(chatController));
router.post('/order/:orderId/messages', chatController.postMessageByOrder.bind(chatController));
router.post('/:id/message', chatController.addMessage.bind(chatController));
exports.default = router;
//# sourceMappingURL=chat.routes.js.map