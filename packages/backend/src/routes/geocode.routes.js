"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geocode_controller_1 = require("../controllers/geocode.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const geocodeController = new geocode_controller_1.GeocodeController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', geocodeController.geocode.bind(geocodeController));
router.get('/reverse', geocodeController.reverseGeocode.bind(geocodeController));
exports.default = router;
//# sourceMappingURL=geocode.routes.js.map