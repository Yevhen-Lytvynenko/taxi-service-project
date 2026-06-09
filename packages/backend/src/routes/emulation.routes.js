"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_service_1 = require("../services/order.service");
const socket_1 = require("../lib/socket");
const emulation_controller_1 = require("../controllers/emulation.controller");
const router = (0, express_1.Router)();
const orderService = new order_service_1.OrderService();
const EMULATION_SECRET = process.env.EMULATION_SECRET || 'emulation_secret';
function checkEmulationSecret(req, res, next) {
    const secret = req.headers['x-emulation-secret'];
    if (secret !== EMULATION_SECRET) {
        return res.status(403).json({ error: 'Invalid emulation secret' });
    }
    next();
}
router.use(checkEmulationSecret);
router.get('/bootstrap', emulation_controller_1.bootstrap);
router.post('/orders/create-and-assign', emulation_controller_1.createAndAssignOrder);
router.post('/orders/:id/simulation-status', emulation_controller_1.setOrderSimulationStatus);
router.post('/drivers/:id/set-online-location', emulation_controller_1.setDriverOnlineLocation);
router.post('/notify-order/:id', async (req, res) => {
    try {
        const order = await orderService.findById(req.params.id);
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        (0, socket_1.getSocketService)().notifyAdminOrderUpdate(order);
        (0, socket_1.getSocketService)().notifyOrderStatus(order.id, order.status);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=emulation.routes.js.map