"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const savedDriverRoute_controller_1 = require("../controllers/savedDriverRoute.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const c = new savedDriverRoute_controller_1.SavedDriverRouteController();
router.use(auth_middleware_1.authMiddleware, (0, auth_middleware_1.roleMiddleware)(['DRIVER']));
router.get('/', c.listMine.bind(c));
router.post('/', c.createMine.bind(c));
router.put('/:id', c.updateMine.bind(c));
router.delete('/:id', c.deleteMine.bind(c));
exports.default = router;
//# sourceMappingURL=driverSavedRoute.routes.js.map