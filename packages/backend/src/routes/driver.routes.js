"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../controllers/driver.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const driverController = new driver_controller_1.DriverController();
router.use(auth_middleware_1.authMiddleware);
router.post('/', authorize_middleware_1.requireOperationsStaff, driverController.create.bind(driverController));
router.get('/', authorize_middleware_1.requireOfficeStaff, driverController.getAll.bind(driverController));
router.get('/:id', (0, authorize_middleware_1.requireDriverSelfOrStaff)(), driverController.getOne.bind(driverController));
router.put('/:id', authorize_middleware_1.requireOperationsStaff, driverController.update.bind(driverController));
router.delete('/:id', authorize_middleware_1.requireOperationsStaff, driverController.delete.bind(driverController));
exports.default = router;
//# sourceMappingURL=driver.routes.js.map