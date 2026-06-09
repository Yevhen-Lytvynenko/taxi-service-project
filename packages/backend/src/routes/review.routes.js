"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const router = (0, express_1.Router)();
const reviewController = new review_controller_1.ReviewController();
router.use(auth_middleware_1.authMiddleware);
router.get('/', authorize_middleware_1.requireOperationsStaff, reviewController.getAll.bind(reviewController));
router.get('/about-me', reviewController.getAboutMe.bind(reviewController));
router.get('/user/:userId', reviewController.getByUserId.bind(reviewController));
router.post('/', reviewController.createAuthenticated.bind(reviewController));
router.get('/driver/:driverId', reviewController.getByDriver.bind(reviewController));
router.delete('/:id', (0, auth_middleware_1.roleMiddleware)(['ADMIN', 'MANAGER']), reviewController.delete.bind(reviewController));
exports.default = router;
//# sourceMappingURL=review.routes.js.map