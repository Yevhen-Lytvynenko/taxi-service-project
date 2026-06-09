import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class LocationService {
  async create(data: Prisma.LocationLogCreateInput) {
    return prisma.locationLog.create({
      data
    });
  }

  async getDriverHistory(driverId: string, from: Date, to: Date) {
    return prisma.locationLog.findMany({
      where: {
        driverId,
        timestamp: {
          gte: from,
          lte: to
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  /** Адмінка: останні точки всіх водіїв (для демо-таблиці без вибору водія). */
  async getRecentLogs(limit = 2000) {
    const lim = Math.min(10000, Math.max(1, limit));
    return prisma.locationLog.findMany({
      take: lim,
      orderBy: { timestamp: 'desc' },
      include: {
        driver: { include: { user: { select: { fullName: true, phone: true } } } },
        order: { select: { id: true, status: true } },
      },
    });
  }

  private readonly GRID_SIZE = 0.01;

  async getHeatmapData(
    from: Date,
    to: Date,
    type: 'pickup' | 'dropoff' | 'both'
  ): Promise<{ latitude: number; longitude: number; weight: number }[]> {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        }
      },
      select: {
        pickupLat: true,
        pickupLng: true,
        dropoffLat: true,
        dropoffLng: true
      }
    });

    const grid = new Map<string, number>();

    const addPoint = (lat: number, lng: number) => {
      const cellLat = Math.floor(lat / this.GRID_SIZE) * this.GRID_SIZE + this.GRID_SIZE / 2;
      const cellLng = Math.floor(lng / this.GRID_SIZE) * this.GRID_SIZE + this.GRID_SIZE / 2;
      const key = `${cellLat.toFixed(4)},${cellLng.toFixed(4)}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    };

    for (const order of orders) {
      if (type === 'pickup' || type === 'both') {
        addPoint(order.pickupLat, order.pickupLng);
      }
      if (type === 'dropoff' || type === 'both') {
        addPoint(order.dropoffLat, order.dropoffLng);
      }
    }

    return Array.from(grid.entries()).map(([key, weight]) => {
      const parts = key.split(',');
      const latStr = parts[0] ?? '0';
      const lngStr = parts[1] ?? '0';
      return {
        latitude: parseFloat(latStr),
        longitude: parseFloat(lngStr),
        weight
      };
    });
  }
}