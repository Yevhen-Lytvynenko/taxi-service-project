import { DriverStatus } from '@prisma/client';
import { haversineDistanceKm } from './geocode.service';
import { getMatchingRadiusKm } from '../config/env';

import { prisma } from '../lib/prisma';

/**
 * Returns driver profile ids that are ONLINE, have coordinates, and are within radius of pickup.
 */
export async function findDriverProfileIdsNearPickup(
  pickupLat: number,
  pickupLng: number,
  radiusKm = getMatchingRadiusKm()
): Promise<string[]> {
  const drivers = await prisma.driverProfile.findMany({
    where: {
      status: DriverStatus.ONLINE,
      currentLat: { not: null },
      currentLng: { not: null },
    },
    select: { id: true, currentLat: true, currentLng: true },
  });

  const ids: string[] = [];
  for (const d of drivers) {
    if (d.currentLat == null || d.currentLng == null) continue;
    const dist = haversineDistanceKm(pickupLat, pickupLng, d.currentLat, d.currentLng);
    if (dist <= radiusKm) {
      ids.push(d.id);
    }
  }
  return ids;
}

/** ETA in minutes: distance / assumed average km/h (urban). */
export function estimateEtaMinutes(distanceKm: number, avgKmh = 22): number {
  if (distanceKm <= 0 || !Number.isFinite(distanceKm)) return 0;
  return (distanceKm / avgKmh) * 60;
}
