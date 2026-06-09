"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLog_controller_1 = require("../controllers/auditLog.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_middleware_1 = require("../middleware/permissions.middleware");
const router = (0, express_1.Router)();
const c = new auditLog_controller_1.AuditLogController();
router.use(auth_middleware_1.authMiddleware, (0, permissions_middleware_1.requireOfficePermission)('audit', 'read'));
router.get('/', c.list.bind(c));
exports.default = router;
//# sourceMappingURL=auditLog.routes.js.map