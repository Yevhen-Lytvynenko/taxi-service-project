import { PrismaClient, Prisma, DriverStatus } from '@prisma/client';
import { geocodeAddress, haversineDistanceKm } from './geocode.service';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CoordinatePoint {
  lat: number;
  lng: number;
  displayName: string;
}

export class OrderService {
  async createFromCoordinates(
    clientId: string,
    pickup: CoordinatePoint,
    dropoff: CoordinatePoint,
    paymentMethod: 'CASH' | 'CARD' | 'BONUS' = 'CASH'
  ) {
    const distanceKm = haversineDistanceKm(
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng
    );

    const tariff = await prisma.tariff.findUnique({
      where: { name: 'ECONOMY' },
    });
    if (!tariff) throw new Error('Тариф ECONOMY не знайдено. Запустіть seed.');

    const base = Number(tariff.basePrice);
    const perKm = Number(tariff.pricePerKm);
    const minPrice = Number(tariff.minPrice);
    const total = Math.max(minPrice, base + perKm * distanceKm);

    return prisma.order.create({
      data: {
        clientId,
        tariffId: tariff.id,
        pickupAddress: pickup.displayName,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoff.displayName,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        distanceKm,
        totalPrice: new Decimal(total),
        paymentMethod,
        status: 'SEARCHING',
      },
      include: {
        tariff: true,
        client: true,
      },
    });
  }

  async createFromAddresses(
    clientId: string,
    pickupAddress: string,
    dropoffAddress: string,
    paymentMethod: 'CASH' | 'CARD' | 'BONUS' = 'CASH'
  ) {
    const [pickupGeo, dropoffGeo] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(dropoffAddress),
    ]);

    if (!pickupGeo) throw new Error('Не вдалося знайти адресу відправлення');
    if (!dropoffGeo) throw new Error('Не вдалося знайти адресу призначення');

    const distanceKm = haversineDistanceKm(
      pickupGeo.lat,
      pickupGeo.lng,
      dropoffGeo.lat,
      dropoffGeo.lng
    );

    const tariff = await prisma.tariff.findUnique({
      where: { name: 'ECONOMY' },
    });
    if (!tariff) throw new Error('Тариф ECONOMY не знайдено. Запустіть seed.');

    const base = Number(tariff.basePrice);
    const perKm = Number(tariff.pricePerKm);
    const minPrice = Number(tariff.minPrice);
    const total = Math.max(minPrice, base + perKm * distanceKm);

    return prisma.order.create({
      data: {
        clientId,
        tariffId: tariff.id,
        pickupAddress: pickupGeo.displayName || pickupAddress,
        pickupLat: pickupGeo.lat,
        pickupLng: pickupGeo.lng,
        dropoffAddress: dropoffGeo.displayName || dropoffAddress,
        dropoffLat: dropoffGeo.lat,
        dropoffLng: dropoffGeo.lng,
        distanceKm,
        totalPrice: new Decimal(total),
        paymentMethod,
        status: 'SEARCHING',
      },
      include: {
        tariff: true,
        client: true,
      },
    });
  }

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: {
        tariff: true,
        client: true
      }
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return prisma.order.findMany({
      where,
      include: {
        client: true,
        driver: {
          include: {
            vehicle: true
          }
        },
        tariff: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        driver: {
          include: {
            vehicle: true
          }
        },
        tariff: true,
        transaction: true,
        review: true,
        chat: true
      }
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        tariff: true
      }
    });
  }

  async delete(id: string) {
    return prisma.order.delete({
      where: { id }
    });
  }
}