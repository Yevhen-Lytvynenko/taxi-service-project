/**
 * Returns driver profile ids that are ONLINE, have coordinates, and are within radius of pickup.
 */
export declare function findDriverProfileIdsNearPickup(pickupLat: number, pickupLng: number, radiusKm?: number): Promise<string[]>;
/** ETA in minutes: distance / assumed average km/h (urban). */
export declare function estimateEtaMinutes(distanceKm: number, avgKmh?: number): number;
//# sourceMappingURL=matching.service.d.ts.map