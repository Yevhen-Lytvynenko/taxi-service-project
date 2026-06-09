"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
exports.createAndAssignOrder = createAndAssignOrder;
exports.setOrderSimulationStatus = setOrderSimulationStatus;
exports.setDriverOnlineLocation = setDriverOnlineLocation;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const order_service_1 = require("../services/order.service");
const socket_1 = require("../lib/socket");
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const orderService = new order_service_1.OrderService();
async function bootstrap(_req, res) {
    try {
        const clients = await prisma_1.prisma.user.findMany({
            where: { role: 'CLIENT' },
            select: { id: true },
        });
        const drivers = await prisma_1.prisma.driverProfile.findMany({
            where: { status: { in: ['ONLINE', 'OFFLINE'] } },
            select: { id: true, currentLat: true, currentLng: true, status: true },
        });
        res.json({ clients, drivers });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
}
async function createAndAssignOrder(req, res) {
    try {
        const { clientId, pickup, dropoff, driverId } = req.body;
        if (!clientId || !pickup || !dropoff || !driverId) {
            return res.status(400).json({ error: 'Missing clientId, pickup, dropoff, or driverId' });
        }
        if (typeof pickup.lat !== 'number' ||
            typeof pickup.lng !== 'number' ||
            typeof dropoff.lat !== 'number' ||
            typeof dropoff.lng !== 'number') {
            return res.status(400).json({ error: 'pickup and dropoff must include numeric lat/lng' });
        }
        const driver = await prisma_1.prisma.driverProfile.findUnique({ where: { id: driverId } });
        if (!driver || driver.status !== 'ONLINE') {
            return res.status(400).json({ error: 'Driver not found or not ONLINE' });
        }
        const order = await orderService.createFromCoordinates(clientId, pickup, dropoff, {
            paymentMethod: 'CASH',
        });
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.order.update({
                where: { id: order.id },
                data: { driverId, status: 'ACCEPTED' },
            }),
            prisma_1.prisma.driverProfile.update({
                where: { id: driverId },
                data: { status: 'BUSY' },
            }),
        ]);
        const full = await orderService.findById(order.id);
        if (full) {
            (0, socket_1.getSocketService)().notifyAdminOrderUpdate(full);
            (0, socket_1.getSocketService)().notifyOrderStatus(order.id, 'ACCEPTED');
        }
        res.json({
            orderId: order.id,
            pickupLat: order.pickupLat,
            pickupLng: order.pickupLng,
            dropoffLat: order.dropoffLat,
            dropoffLng: order.dropoffLng,
        });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
}
async function setOrderSimulationStatus(req, res) {
    const id = req.params.id;
    const { status } = req.body;
    const allowed = ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
    if (!status || !allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const nextStatus = status;
        if (nextStatus === 'IN_PROGRESS') {
            await orderService.update(id, { status: nextStatus, startedAt: new Date() });
        }
        else if (nextStatus === 'COMPLETED') {
            const existing = await orderService.findById(id);
            if (!existing)
                return res.status(404).json({ error: 'Order not found' });
            const total = Number(existing.totalPrice);
            const rate = (0, env_1.getPlatformCommissionRate)();
            const platformFeeNum = Number((total * rate).toFixed(2));
            const driverEarnNum = Number((total - platformFeeNum).toFixed(2));
            const platformFee = new library_1.Decimal(platformFeeNum);
            const driverEarn = new library_1.Decimal(driverEarnNum);
            const existingTx = await prisma_1.prisma.transaction.findFirst({ where: { orderId: id } });
            await prisma_1.prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id },
                    data: {
                        status: 'COMPLETED',
                        finishedAt: new Date(),
                        platformFeeAmount: platformFee,
                        driverEarningAmount: driverEarn,
                    },
                });
                if (existing.driverId) {
                    await tx.driverProfile.update({
                        where: { id: existing.driverId },
                        data: { status: client_1.DriverStatus.ONLINE, balance: { increment: driverEarn } },
                    });
                }
                if (!existingTx && existing.driverId) {
                    await tx.transaction.create({
                        data: {
                            driverId: existing.driverId,
                            orderId: id,
                            amount: driverEarn,
                            type: 'ORDER_EARNING',
                        },
                    });
                }
            });
        }
        else {
            await orderService.update(id, { status: nextStatus });
        }
        const full = await orderService.findById(id);
        if (full) {
            (0, socket_1.getSocketService)().notifyAdminOrderUpdate(full);
            (0, socket_1.getSocketService)().notifyOrderStatus(id, nextStatus);
        }
        res.json({ ok: true });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
}
async function setDriverOnlineLocation(req, res) {
    const id = req.params.id;
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ error: 'lat and lng must be numbers' });
    }
    try {
        await prisma_1.prisma.driverProfile.update({
            where: { id },
            data: { status: 'ONLINE', currentLat: lat, currentLng: lng },
        });
        res.json({ ok: true });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ error: msg });
    }
}
//# sourceMappingURL=emulation.controller.js.map