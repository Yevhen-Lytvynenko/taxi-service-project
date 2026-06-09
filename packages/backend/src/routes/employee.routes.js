"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const employeeController = new employee_controller_1.EmployeeController();
router.use(auth_middleware_1.authMiddleware);
router.post('/', (0, auth_middleware_1.roleMiddleware)(['ADMIN']), employeeController.create.bind(employeeController));
router.get('/', authorize_middleware_1.requireOfficeStaff, employeeController.getAll.bind(employeeController));
router.put('/:id', (0, auth_middleware_1.roleMiddleware)(['ADMIN']), employeeController.update.bind(employeeController));
router.delete('/:id', (0, auth_middleware_1.roleMiddleware)(['ADMIN']), employeeController.delete.bind(employeeController));
exports.default = router;
//# sourceMappingURL=employee.routes.js.map