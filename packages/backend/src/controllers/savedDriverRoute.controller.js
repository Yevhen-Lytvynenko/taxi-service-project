"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedDriverRouteController = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const geocode_service_1 = require("../services/geocode.service");
const bodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    pickupAddress: zod_1.z.string().min(3),
    dropoffAddress: zod_1.z.string().min(3),
});
class SavedDriverRouteController {
    async listMine(req, res) {
        try {
            const driverId = req.user?.driverId;
            if (!driverId)
                return res.status(403).json({ error: 'Driver only' });
            const rows = await prisma_1.prisma.savedDriverRoute.findMany({
                where: { driverProfileId: driverId },
                orderBy: { createdAt: 'desc' },
            });
            res.json(rows);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async createMine(req, res) {
        try {
            const driverId = req.user?.driverId;
            if (!driverId)
                return res.status(403).json({ error: 'Driver only' });
            const parsed = bodySchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ error: parsed.error.flatten() });
            const { name, pickupAddress, dropoffAddress } = parsed.data;
            const [pickupGeo, dropoffGeo] = await Promise.all([
                (0, geocode_service_1.geocodeAddress)(pickupAddress),
                (0, geocode_service_1.geocodeAddress)(dropoffAddress),
            ]);
            if (!pickupGeo || !dropoffGeo) {
                return res.status(400).json({ error: 'Не вдалося геокодувати адреси' });
            }
            const row = await prisma_1.prisma.savedDriverRoute.create({
                data: {
                    driverProfileId: driverId,
                    name,
                    pickupAddress: pickupGeo.displayName || pickupAddress,
                    pickupLat: pickupGeo.lat,
                    pickupLng: pickupGeo.lng,
                    dropoffAddress: dropoffGeo.displayName || dropoffAddress,
                    dropoffLat: dropoffGeo.lat,
                    dropoffLng: dropoffGeo.lng,
                },
            });
            res.status(201).json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async updateMine(req, res) {
        try {
            const driverId = req.user?.driverId;
            if (!driverId)
                return res.status(403).json({ error: 'Driver only' });
            const id = req.params.id;
            const partial = zod_1.z
                .object({
                name: zod_1.z.string().min(1).optional(),
                pickupAddress: zod_1.z.string().min(3).optional(),
                dropoffAddress: zod_1.z.string().min(3).optional(),
            })
                .safeParse(req.body);
            if (!partial.success)
                return res.status(400).json({ error: partial.error.flatten() });
            const existing = await prisma_1.prisma.savedDriverRoute.findFirst({
                where: { id, driverProfileId: driverId },
            });
            if (!existing)
                return res.status(404).json({ error: 'Not found' });
            let pickupLat = existing.pickupLat;
            let pickupLng = existing.pickupLng;
            let pickupAddress = existing.pickupAddress;
            let dropoffLat = existing.dropoffLat;
            let dropoffLng = existing.dropoffLng;
            let dropoffAddress = existing.dropoffAddress;
            if (partial.data.pickupAddress) {
                const g = await (0, geocode_service_1.geocodeAddress)(partial.data.pickupAddress);
                if (!g)
                    return res.status(400).json({ error: 'Не вдалося геокодувати адресу подачі' });
                pickupLat = g.lat;
                pickupLng = g.lng;
                pickupAddress = g.displayName || partial.data.pickupAddress;
            }
            if (partial.data.dropoffAddress) {
                const g = await (0, geocode_service_1.geocodeAddress)(partial.data.dropoffAddress);
                if (!g)
                    return res.status(400).json({ error: 'Не вдалося геокодувати адресу призначення' });
                dropoffLat = g.lat;
                dropoffLng = g.lng;
                dropoffAddress = g.displayName || partial.data.dropoffAddress;
            }
            const row = await prisma_1.prisma.savedDriverRoute.update({
                where: { id },
                data: {
                    name: partial.data.name ?? existing.name,
                    pickupAddress,
                    pickupLat,
                    pickupLng,
                    dropoffAddress,
                    dropoffLat,
                    dropoffLng,
                },
            });
            res.json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async deleteMine(req, res) {
        try {
            const driverId = req.user?.driverId;
            if (!driverId)
                return res.status(403).json({ error: 'Driver only' });
            const id = req.params.id;
            const existing = await prisma_1.prisma.savedDriverRoute.findFirst({
                where: { id, driverProfileId: driverId },
            });
            if (!existing)
                return res.status(404).json({ error: 'Not found' });
            await prisma_1.prisma.savedDriverRoute.delete({ where: { id } });
            res.status(204).send();
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.SavedDriverRouteController = SavedDriverRouteController;
//# sourceMappingURL=savedDriverRoute.controller.js.map