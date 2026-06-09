"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const route_controller_1 = require("../controllers/route.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const routeController = new route_controller_1.RouteController();
router.use(auth_middleware_1.authMiddleware);
router.get('/alternatives', routeController.alternatives.bind(routeController));
router.get('/', routeController.route.bind(routeController));
exports.default = router;
//# sourceMappingURL=route.routes.js.map