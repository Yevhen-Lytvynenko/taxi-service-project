"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
class PaymentController {
    async createIntent(req, res) {
        try {
            const orderId = req.body.orderId;
            if (!orderId) {
                return res.status(400).json({ error: 'orderId is required' });
            }
            const result = await (0, payment_service_1.createPaymentIntentForOrder)(orderId);
            res.json(result);
        }
        catch (e) {
            const status = e.message === 'Order not found' ? 404 : 400;
            res.status(status).json({ error: e.message });
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map