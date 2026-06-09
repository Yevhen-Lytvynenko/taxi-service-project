"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const client_1 = require("@prisma/client");
const odessa_addresses_1 = require("../data/odessa-addresses");
const prisma_1 = require("../lib/prisma");
function distanceMetersApprox(a, b) {
    const R = 6371000;
    const p1 = (a.lat * Math.PI) / 180;
    const p2 = (b.lat * Math.PI) / 180;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 +
        Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
class SocketService {
    io;
    /** Прореживання записів у БД: сокет і driver_moved лишаються частими. */
    lastPersistedLocation = new Map();
    static LOC_LOG_MIN_INTERVAL_MS = 12_000;
    static LOC_LOG_MIN_DISTANCE_M = 75;
    constructor(io) {
        this.io = io;
        this.initialize();
    }
    initialize() {
        this.io.on('connection', (socket) => {
            socket.on('join_room', (room) => {
                socket.join(room);
            });
            socket.on('admin_connect', () => {
                socket.join('admin_monitoring');
            });
            socket.on('update_location', async (data) => {
                try {
                    await this.processLocationUpdate(data);
                }
                catch (error) {
                    console.error(`Error updating location for driver ${data.driverId}:`, error);
                }
            });
            socket.on('send_message', async (data) => {
                const { orderId, text, sender } = data;
                this.io.to(`order_${orderId}`).emit('new_message', { text, sender, time: new Date() });
            });
            socket.on('disconnect', () => {
                // Handle disconnect logic if needed
            });
        });
    }
    async processLocationUpdate(data) {
        const newStatus = data.status || client_1.DriverStatus.ONLINE;
        const { lat, lng } = (0, odessa_addresses_1.clampToOdessaDriveBounds)(data.lat, data.lng);
        let orderId = data.orderId ?? null;
        if (!orderId) {
            const active = await prisma_1.prisma.order.findFirst({
                where: {
                    driverId: data.driverId,
                    status: { in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] },
                },
                orderBy: { updatedAt: 'desc' },
                select: { id: true },
            });
            orderId = active?.id ?? null;
        }
        const now = Date.now();
        const prev = this.lastPersistedLocation.get(data.driverId);
        let writeLog = true;
        if (prev) {
            const dt = now - prev.t;
            const distM = distanceMetersApprox(prev, { lat, lng });
            writeLog =
                dt >= SocketService.LOC_LOG_MIN_INTERVAL_MS ||
                    distM >= SocketService.LOC_LOG_MIN_DISTANCE_M;
        }
        const updatedDriver = await prisma_1.prisma.$transaction(async (tx) => {
            const u = await tx.driverProfile.update({
                where: { id: data.driverId },
                data: {
                    currentLat: lat,
                    currentLng: lng,
                    status: newStatus,
                },
                include: {
                    user: true,
                    vehicle: true,
                },
            });
            if (writeLog) {
                await tx.locationLog.create({
                    data: {
                        driverId: data.driverId,
                        orderId,
                        lat,
                        lng,
                    },
                });
                this.lastPersistedLocation.set(data.driverId, { t: now, lat, lng });
            }
            return u;
        });
        this.io.to(`driver_tracking_${data.driverId}`).emit('driver_moved', {
            ...data,
            lat,
            lng,
            status: newStatus
        });
        this.io.to('admin_monitoring').emit('admin:driver-update', {
            driverId: data.driverId,
            lat,
            lng,
            status: newStatus.toLowerCase(),
            updatedAt: new Date().toISOString(),
            name: updatedDriver.user.fullName,
            carModel: updatedDriver.vehicle?.model ?? '—'
        });
    }
    notifyDriverNewOrder(driverId, order) {
        this.io.to(`driver_${driverId}`).emit('new_order', order);
    }
    notifyOrderStatus(orderId, status) {
        this.io.to(`order_${orderId}`).emit('order_status_changed', { status });
    }
    /** Оновлення навігаційної полілінії (ноги поїздки) для клієнта та водія в кімнаті замовлення. */
    notifyOrderRouteUpdated(orderId, payload) {
        this.io.to(`order_${orderId}`).emit('order_route_updated', payload);
    }
    /** Нове повідомлення в чаті поїздки (history у БД — Json). */
    notifyOrderChatMessage(orderId, payload) {
        this.io.to(`order_${orderId}`).emit('order_chat_message', payload);
    }
    /** Черга водіїв: прибрати замовлення зі списку SEARCHING (скасування клієнтом). */
    broadcastOrderCancelled(orderId) {
        this.io.emit('order_cancelled', { orderId });
    }
    notifyAdminOrderUpdate(order) {
        this.io.to('admin_monitoring').emit('admin:order-update', order);
    }
    /** GPS demo process: keep in-memory driver state aligned (cruise vs order leg). */
    syncGpsSimulatorDriver(payload) {
        this.io.emit('gps_sim_driver_sync', payload);
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socket.service.js.map