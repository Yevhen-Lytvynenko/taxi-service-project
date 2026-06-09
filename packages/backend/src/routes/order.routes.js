"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_middleware_1 = require("../middleware/permissions.middleware");
const router = (0, express_1.Router)();
const orderController = new order_controller_1.OrderController();
router.post('/quote', auth_middleware_1.authMiddleware, orderController.quote.bind(orderController));
router.post('/dispatch', auth_middleware_1.authMiddleware, (0, permissions_middleware_1.requireOfficePermission)('dispatch', 'write'), orderController.dispatchCreate.bind(orderController));
router.post('/', auth_middleware_1.authMiddleware, orderController.create.bind(orderController));
router.get('/', auth_middleware_1.authMiddleware, orderController.getAll.bind(orderController));
router.get('/:id', auth_middleware_1.authMiddleware, orderController.getOne.bind(orderController));
router.put('/:id', auth_middleware_1.authMiddleware, orderController.update.bind(orderController));
router.delete('/:id', auth_middleware_1.authMiddleware, orderController.delete.bind(orderController));
router.put('/:id/route', auth_middleware_1.authMiddleware, orderController.selectRoute.bind(orderController));
router.post('/:id/simulate', auth_middleware_1.authMiddleware, orderController.simulate.bind(orderController));
exports.default = router;
//# sourceMappingURL=order.routes.js.map