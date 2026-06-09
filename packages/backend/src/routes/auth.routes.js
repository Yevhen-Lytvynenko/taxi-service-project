"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/register/driver', authController.registerDriver.bind(authController));
router.get('/me', auth_middleware_1.authMiddleware, authController.getMe.bind(authController));
router.patch('/me/push-token', auth_middleware_1.authMiddleware, authController.updatePushToken.bind(authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map