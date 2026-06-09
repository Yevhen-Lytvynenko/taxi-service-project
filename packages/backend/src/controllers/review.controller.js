"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const review_service_1 = require("../services/review.service");
const reviewService = new review_service_1.ReviewService();
class ReviewController {
    async getAll(req, res) {
        try {
            const reviews = await reviewService.findAll();
            res.json(reviews);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /** Відгуки про поточного користувача (профіль). */
    async getAboutMe(req, res) {
        try {
            const reviews = await reviewService.findBySubjectUserId(req.user.id);
            res.json(reviews);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    /** Публічні відгуки про користувача за id (для перегляду контрагента). */
    async getByUserId(req, res) {
        try {
            const reviews = await reviewService.findBySubjectUserId(req.params.userId);
            res.json(reviews);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createAuthenticated(req, res) {
        try {
            const user = req.user;
            const { orderId, rating, comment } = req.body;
            if (!orderId)
                return res.status(400).json({ error: 'orderId is required' });
            const r = Number(rating);
            if (!Number.isFinite(r))
                return res.status(400).json({ error: 'rating is required' });
            if (user.role === 'CLIENT') {
                const review = await reviewService.createClientReview(user.id, orderId, r, comment);
                return res.status(201).json(review);
            }
            if (user.role === 'DRIVER' && user.driverId) {
                const review = await reviewService.createDriverReview(user.id, user.driverId, orderId, r, comment);
                return res.status(201).json(review);
            }
            return res.status(403).json({ error: 'Only clients and drivers can leave trip reviews' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getByDriver(req, res) {
        try {
            const reviews = await reviewService.findByDriverId(req.params.driverId);
            res.json(reviews);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            await reviewService.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ReviewController = ReviewController;
//# sourceMappingURL=review.controller.js.map