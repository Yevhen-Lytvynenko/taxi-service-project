"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaint_controller_1 = require("../controllers/complaint.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const c = new complaint_controller_1.ComplaintController();
router.post('/', auth_middleware_1.authMiddleware, c.create.bind(c));
router.get('/', auth_middleware_1.authMiddleware, authorize_middleware_1.requireOperationsStaff, c.listStaff.bind(c));
router.patch('/:id/status', auth_middleware_1.authMiddleware, authorize_middleware_1.requireOperationsStaff, c.updateStatus.bind(c));
exports.default = router;
//# sourceMappingURL=complaint.routes.js.map