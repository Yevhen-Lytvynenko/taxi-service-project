"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tariff_controller_1 = require("../controllers/tariff.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const tariffController = new tariff_controller_1.TariffController();
router.get('/', auth_middleware_1.authMiddleware, tariffController.getAll.bind(tariffController));
router.get('/:id', auth_middleware_1.authMiddleware, tariffController.getOne.bind(tariffController));
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['ADMIN', 'ACCOUNTANT']), tariffController.create.bind(tariffController));
router.put('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['ADMIN', 'ACCOUNTANT']), tariffController.update.bind(tariffController));
router.delete('/:id', auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['ADMIN', 'ACCOUNTANT']), tariffController.delete.bind(tariffController));
exports.default = router;
//# sourceMappingURL=tariff.routes.js.map