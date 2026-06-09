"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const locationController = new location_controller_1.LocationController();
router.use(auth_middleware_1.authMiddleware);
router.get('/recent', locationController.listRecent.bind(locationController));
router.post('/', locationController.create.bind(locationController));
router.get('/history', locationController.getHistory.bind(locationController));
router.get('/heatmap', locationController.getHeatmap.bind(locationController));
exports.default = router;
//# sourceMappingURL=location.routes.js.map