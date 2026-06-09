"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driverSelf_controller_1 = require("../controllers/driverSelf.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new driverSelf_controller_1.DriverSelfController();
router.patch('/me/status', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['DRIVER']), controller.updateStatus.bind(controller));
router.get('/me/earnings', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['DRIVER']), controller.getMyEarnings.bind(controller));
exports.default = router;
//# sourceMappingURL=driverSelf.routes.js.map