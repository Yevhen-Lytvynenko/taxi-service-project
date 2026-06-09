"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const officeRole_controller_1 = require("../controllers/officeRole.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_middleware_1 = require("../middleware/permissions.middleware");
const router = (0, express_1.Router)();
const c = new officeRole_controller_1.OfficeRoleController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, permissions_middleware_1.requireOfficePermission)('roles_manage', 'read'), c.list.bind(c));
router.post('/', (0, permissions_middleware_1.requireOfficePermission)('roles_manage', 'write'), c.create.bind(c));
router.patch('/:id', (0, permissions_middleware_1.requireOfficePermission)('roles_manage', 'write'), c.patch.bind(c));
router.delete('/:id', (0, permissions_middleware_1.requireOfficePermission)('roles_manage', 'write'), c.remove.bind(c));
exports.default = router;
//# sourceMappingURL=officeRole.routes.js.map