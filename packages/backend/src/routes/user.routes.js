"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['ADMIN']), userController.create.bind(userController));
router.get('/', auth_middleware_1.authMiddleware, authorize_middleware_1.requireOperationsStaff, userController.getAll.bind(userController));
router.get('/:id', auth_middleware_1.authMiddleware, (0, authorize_middleware_1.requireSelfOrStaff)(), userController.getOne.bind(userController));
router.put('/:id', auth_middleware_1.authMiddleware, (0, authorize_middleware_1.requireSelfOrStaff)(), userController.update.bind(userController));
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['ADMIN']), userController.delete.bind(userController));
exports.default = router;
//# sourceMappingURL=user.routes.js.map