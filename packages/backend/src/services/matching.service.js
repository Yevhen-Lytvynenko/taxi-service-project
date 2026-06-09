"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDriverProfileIdsNearPickup = findDriverProfileIdsNearPickup;
exports.estimateEtaMinutes = estimateEtaMinutes;
const client_1 = require("@prisma/client");
const geocode_service_1 = require("./geocode.service");
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
/**
 * Returns driver profile ids that are ONLINE, have coordinates, and are within radius of pickup.
 */
async function findDriverProfileIdsNearPickup(pickupLat, pickupLng, radiusKm = (0, env_1.getMatchingRadiusKm)()) {
    const drivers = await prisma_1.prisma.driverProfile.findMany({
        where: {
            status: client_1.DriverStatus.ONLINE,
            currentLat: { not: null },
            currentLng: { not: null },
        },
        select: { id: true, currentLat: true, currentLng: true },
    });
    const ids = [];
    for (const d of drivers) {
        if (d.currentLat == null || d.currentLng == null)
            continue;
        const dist = (0, geocode_service_1.haversineDistanceKm)(pickupLat, pickupLng, d.currentLat, d.currentLng);
        if (dist <= radiusKm) {
            ids.push(d.id);
        }
    }
    return ids;
}
/** ETA in minutes: distance / assumed average km/h (urban). */
function estimateEtaMinutes(distanceKm, avgKmh = 22) {
    if (distanceKm <= 0 || !Number.isFinite(distanceKm))
        return 0;
    return (distanceKm / avgKmh) * 60;
}
//# sourceMappingURL=matching.service.js.map