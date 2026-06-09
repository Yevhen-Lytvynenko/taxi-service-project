"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const c = new payment_controller_1.PaymentController();
router.post('/create-intent', auth_middleware_1.authMiddleware, c.createIntent.bind(c));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map