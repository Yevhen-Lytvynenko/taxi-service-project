"use strict";
/**
 * Order simulation service for demo: drives driver along OSRM route,
 * updates statuses (ARRIVED, IN_PROGRESS, COMPLETED).
 * Runs in background, triggered by POST /api/orders/:id/simulate.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSimulationService = void 0;
const client_1 = require("@prisma/client");
const odessa_addresses_1 = require("../data/odessa-addresses");
const socket_1 = require("../lib/socket");
const order_service_1 = require("./order.service");
const prisma_1 = require("../lib/prisma");
const orderService = new order_service_1.OrderService();
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
/** Інтервал між точками на маршруті (мс). За замовчуванням швидше для демо; перевизначте через env. */
const STEP_MS_DEFAULT = Number(process.env.ORDER_SIM_STEP_MS) > 0 ? Number(process.env.ORDER_SIM_STEP_MS) : 600;
const STEP_MS_TO_PICKUP = Number(process.env.ORDER_SIM_TO_PICKUP_STEP_MS) > 0
    ? Number(process.env.ORDER_SIM_TO_PICKUP_STEP_MS)
    : 350;
const runningSimulations = new Set();
/** Parse saved [lng, lat][] polyline to {lat, lng}[] for driving. */
function parseSavedPolyline(raw) {
    if (!Array.isArray(raw) || raw.length < 2)
        return null;
    const points = [];
    for (const p of raw) {
        if (Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number') {
            const c = (0, odessa_addresses_1.clampToOdessaDriveBounds)(p[1], p[0]);
            points.push(c);
        }
    }
    return points.length >= 2 ? points : null;
}
async function isOrderCancelled(orderId) {
    const o = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
    });
    return o?.status === 'CANCELLED';
}
const SECOND_LEG_POLL_MS = 500;
/** Wait until trip to dropoff is allowed: IN_PROGRESS and a stored dropoff polyline (or legacy planned). */
async function waitForSecondLegPolyline(orderId) {
    for (;;) {
        if (await isOrderCancelled(orderId))
            return null;
        const o = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                status: true,
                navigationRouteToDropoff: true,
                plannedRoutePolyline: true,
            },
        });
        if (!o || o.status === 'CANCELLED')
            return null;
        const poly = parseSavedPolyline(o.navigationRouteToDropoff) ?? parseSavedPolyline(o.plannedRoutePolyline);
        if (o.status === 'IN_PROGRESS' && poly && poly.length >= 2) {
            return poly;
        }
        await sleep(SECOND_LEG_POLL_MS);
    }
}
async function getRoute(from, to) {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'StrumTaxi-Simulate/1.0' } });
        if (!res.ok)
            return null;
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates)
            return null;
        return data.routes[0].geometry.coordinates.map(([lng, lat]) => (0, odessa_addresses_1.clampToOdessaDriveBounds)(lat, lng));
    }
    catch {
        return null;
    }
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function interpolate(from, to, steps) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push((0, odessa_addresses_1.clampToOdessaDriveBounds)(from.lat + t * (to.lat - from.lat), from.lng + t * (to.lng - from.lng)));
    }
    return points;
}
class OrderSimulationService {
    async run(orderId) {
        if (runningSimulations.has(orderId)) {
            return;
        }
        runningSimulations.add(orderId);
        try {
            const order = await prisma_1.prisma.order.findUnique({
                where: { id: orderId },
                include: { driver: true },
            });
            if (!order || !order.driverId || !order.driver) {
                throw new Error('Order not found or has no driver');
            }
            const status = order.status;
            if (status !== 'ACCEPTED' && status !== 'ARRIVED' && status !== 'IN_PROGRESS') {
                throw new Error(`Cannot simulate: order status must be ACCEPTED, ARRIVED, or IN_PROGRESS. Got: ${status}`);
            }
            const driverId = order.driverId;
            const socket = (0, socket_1.getSocketService)();
            let lat;
            let lng;
            if (order.driver.currentLat != null && order.driver.currentLng != null) {
                const c = (0, odessa_addresses_1.clampToOdessaDriveBounds)(order.driver.currentLat, order.driver.currentLng);
                lat = c.lat;
                lng = c.lng;
            }
            else {
                const c = (0, odessa_addresses_1.clampToOdessaDriveBounds)(order.pickupLat - 0.008, order.pickupLng);
                lat = c.lat;
                lng = c.lng;
            }
            const savedToPickup = parseSavedPolyline(order.navigationRouteToPickup);
            const driveAlong = async (from, to, stepMs = STEP_MS_DEFAULT, polylineOverride) => {
                const points = polylineOverride ??
                    (await getRoute(from, to)) ??
                    interpolate(from, to, 25);
                for (const p of points) {
                    if (await isOrderCancelled(orderId)) {
                        return true;
                    }
                    await socket.processLocationUpdate({
                        driverId,
                        lat: p.lat,
                        lng: p.lng,
                        status: client_1.DriverStatus.BUSY,
                    });
                    await sleep(stepMs);
                }
                return false;
            };
            if (status === 'ACCEPTED') {
                const aborted1 = await driveAlong({ lat, lng }, { lat: order.pickupLat, lng: order.pickupLng }, STEP_MS_TO_PICKUP, savedToPickup);
                if (aborted1 || (await isOrderCancelled(orderId))) {
                    return;
                }
                lat = order.pickupLat;
                lng = order.pickupLng;
                const updated = await orderService.update(orderId, { status: 'ARRIVED' });
                socket.notifyAdminOrderUpdate(updated);
                socket.notifyOrderStatus(orderId, 'ARRIVED');
            }
            const secondLeg = await waitForSecondLegPolyline(orderId);
            if (!secondLeg) {
                return;
            }
            const aborted2 = await driveAlong({ lat: order.pickupLat, lng: order.pickupLng }, { lat: order.dropoffLat, lng: order.dropoffLng }, STEP_MS_DEFAULT, secondLeg);
            if (aborted2 || (await isOrderCancelled(orderId))) {
                return;
            }
            if (await isOrderCancelled(orderId)) {
                return;
            }
            const completed = await orderService.update(orderId, {
                status: 'COMPLETED',
                finishedAt: new Date(),
            });
            await prisma_1.prisma.driverProfile.update({
                where: { id: driverId },
                data: { status: client_1.DriverStatus.ONLINE },
            });
            const end = (0, odessa_addresses_1.clampToOdessaDriveBounds)(order.dropoffLat, order.dropoffLng);
            socket.syncGpsSimulatorDriver({
                driverId,
                status: 'ONLINE',
                lat: end.lat,
                lng: end.lng,
            });
            socket.notifyAdminOrderUpdate(completed);
            socket.notifyOrderStatus(orderId, 'COMPLETED');
        }
        finally {
            runningSimulations.delete(orderId);
        }
    }
}
exports.OrderSimulationService = OrderSimulationService;
//# sourceMappingURL=orderSimulation.service.js.map