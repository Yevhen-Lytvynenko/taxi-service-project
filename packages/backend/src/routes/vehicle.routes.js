"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const vehicleController = new vehicle_controller_1.VehicleController();
router.use(auth_middleware_1.authMiddleware);
router.post('/', authorize_middleware_1.requireOperationsStaff, vehicleController.create.bind(vehicleController));
router.get('/', authorize_middleware_1.requireOfficeStaff, vehicleController.getAll.bind(vehicleController));
router.get('/:id', vehicleController.getOne.bind(vehicleController));
router.put('/:id', authorize_middleware_1.requireOperationsStaff, vehicleController.update.bind(vehicleController));
router.delete('/:id', authorize_middleware_1.requireOperationsStaff, vehicleController.delete.bind(vehicleController));
exports.default = router;
//# sourceMappingURL=vehicle.routes.js.map