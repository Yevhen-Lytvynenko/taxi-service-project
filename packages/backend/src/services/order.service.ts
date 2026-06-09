import { CarClass, DeliveryPayer, OrderStatus, Prisma } from '@prisma/client';
import { geocodeAddress, haversineDistanceKm } from './geocode.service';
import { getRoute } from './route.service';
import { Decimal } from '@prisma/client/runtime/library';
import { getMatchDeadlineSeconds, getSurgeMultiplier } from '../config/env';

import { prisma } from '../lib/prisma';

/** Спрощення полілінії для клієнтської мапи (менше точок — швидший WebView). */
function subsampleRouteCoords(coords: Array<[number, number]>, maxPoints: number): Array<[number, number]> {
  if (coords.length <= maxPoints) return coords;
  const out: Array<[number, number]> = [];
  const step = (coords.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    out.push(coords[Math.min(idx, coords.length - 1)]!);
  }
  return out;
}

const CAR_ORDER: CarClass[] = [
  'ECONOMY',
  'STANDARD',
  'COMFORT',
  'BUSINESS',
  'MINIVAN',
  'DELIVERY',
  'EXPRESS',
];

/** Тарифи в застосунку клієнта: економ, стандарт, комфорт, швидкий пошук, доставка. */
export const CLIENT_APP_QUOTE_TARIFFS: CarClass[] = [
  'ECONOMY',
  'STANDARD',
  'COMFORT',
  'EXPRESS',
  'DELIVERY',
];

/** Підписи тарифів для клієнтських застосунків (українською), у дусі UKLON. */
export const TARIFF_UI_UK: Record<CarClass, { title: string; subtitle: string }> = {
  ECONOMY: { title: 'Економ', subtitle: 'Найнижча ціна по місту' },
  STANDARD: { title: 'Стандарт', subtitle: 'Баланс ціни та комфорту' },
  COMFORT: { title: 'Комфорт', subtitle: 'Авто вищого класу' },
  BUSINESS: { title: 'Бізнес', subtitle: 'Для ділових поїздок' },
  MINIVAN: { title: 'Мінівен', subtitle: 'До 7 пасажирів або багажу' },
  DELIVERY: { title: 'Доставка', subtitle: 'Кур’єр: відправник → отримувач' },
  EXPRESS: { title: 'Швидкий пошук', subtitle: 'Пріоритет у черзі водіїв' },
};

export interface CreateOrderCoordOpts {
  paymentMethod?: 'CASH' | 'CARD' | 'BONUS';
  promoCode?: string | null;
  preferredDriverUserId?: string | null;
  tariffName?: CarClass;
  clientPreferences?: string[];
  deliverySenderName?: string | null;
  deliverySenderPhone?: string | null;
  deliveryRecipientName?: string | null;
  deliveryRecipientPhone?: string | null;
  deliveryPayer?: DeliveryPayer | null;
}

export interface ResolveEndpointsInput {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}

function computeTariffTotal(
  tariff: {
    basePrice: unknown;
    pricePerKm: unknown;
    pricePerMin: unknown;
    minPrice: unknown;
  },
  plannedKm: number,
  plannedMin: number,
  surge: number
): number {
  const base = Number(tariff.basePrice);
  const perKm = Number(tariff.pricePerKm);
  const perMin = Number(tariff.pricePerMin) || 0;
  const minPrice = Number(tariff.minPrice);
  const rawTotal = Math.max(minPrice, base + perKm * plannedKm + perMin * plannedMin);
  return Math.round(rawTotal * surge * 100) / 100;
}

/** Без пароля та pushToken — для JSON замовлень. */
const orderClientInclude = {
  select: {
    id: true,
    fullName: true,
    phone: true,
    rating: true,
    role: true,
  },
} as const;

const driverUserPublicSelect = {
  id: true,
  fullName: true,
  phone: true,
} as const;

export interface CoordinatePoint {
  lat: number;
  lng: number;
  displayName: string;
}

export class OrderService {
  async resolveOrderEndpoints(input: ResolveEndpointsInput): Promise<{
    pickup: CoordinatePoint;
    dropoff: CoordinatePoint;
  }> {
    const pa = input.pickupAddress.trim();
    const da = input.dropoffAddress.trim();
    if (!pa || !da) {
      throw new Error('Вкажіть адреси відправлення та призначення');
    }

    let pickup: CoordinatePoint;
    if (typeof input.pickupLat === 'number' && typeof input.pickupLng === 'number') {
      pickup = { lat: input.pickupLat, lng: input.pickupLng, displayName: pa };
    } else {
      const g = await geocodeAddress(pa);
      if (!g) throw new Error('Не вдалося знайти адресу відправлення');
      pickup = {
        lat: g.lat,
        lng: g.lng,
        displayName: g.shortLabel || g.displayName,
      };
    }

    let dropoff: CoordinatePoint;
    if (typeof input.dropoffLat === 'number' && typeof input.dropoffLng === 'number') {
      dropoff = { lat: input.dropoffLat, lng: input.dropoffLng, displayName: da };
    } else {
      const g = await geocodeAddress(da);
      if (!g) throw new Error('Не вдалося знайти адресу призначення');
      dropoff = {
        lat: g.lat,
        lng: g.lng,
        displayName: g.shortLabel || g.displayName,
      };
    }

    return { pickup, dropoff };
  }

  async quoteTripEndpoints(
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number },
    opts?: { tariffCodes?: CarClass[] }
  ) {
    const distanceKm = haversineDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const route = await getRoute(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: dropoff.lat, lng: dropoff.lng }
    );
    const plannedKm = route?.distanceKm ?? distanceKm;
    const plannedMin = route?.durationMinutes ?? Math.max(1, (plannedKm / 25) * 60);
    const surge = getSurgeMultiplier();
    const tariffs = await prisma.tariff.findMany();
    const codeOrder =
      opts?.tariffCodes && opts.tariffCodes.length > 0 ? opts.tariffCodes : CAR_ORDER;
    const sorted = codeOrder.map((code) => tariffs.find((t) => t.name === code)).filter(
      (t): t is NonNullable<typeof t> => !!t
    );

    const routePolyline: Array<[number, number]> | null =
      route?.coordinates && route.coordinates.length >= 2
        ? subsampleRouteCoords(route.coordinates, 220)
        : null;

    return {
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      plannedRouteDistanceKm: Math.round(plannedKm * 1000) / 1000,
      plannedRouteDurationMin: Math.round(plannedMin * 10) / 10,
      surgeMultiplier: surge,
      routePolyline,
      tariffs: sorted.map((t) => ({
        code: t.name,
        title: TARIFF_UI_UK[t.name].title,
        subtitle: TARIFF_UI_UK[t.name].subtitle,
        totalPrice: computeTariffTotal(t, plannedKm, plannedMin, surge),
      })),
    };
  }

  async createFromCoordinates(
    clientId: string,
    pickup: CoordinatePoint,
    dropoff: CoordinatePoint,
    opts: CreateOrderCoordOpts = {}
  ) {
    const {
      paymentMethod = 'CASH',
      promoCode,
      preferredDriverUserId,
      tariffName = 'ECONOMY',
      clientPreferences,
      deliverySenderName,
      deliverySenderPhone,
      deliveryRecipientName,
      deliveryRecipientPhone,
      deliveryPayer,
    } = opts;

    const distanceKm = haversineDistanceKm(
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng
    );

    const tariff = await prisma.tariff.findUnique({
      where: { name: tariffName },
    });
    if (!tariff) throw new Error(`Тариф ${tariffName} не знайдено. Запустіть seed.`);

    const route = await getRoute(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: dropoff.lat, lng: dropoff.lng }
    );
    const plannedKm = route?.distanceKm ?? distanceKm;
    const plannedMin =
      route?.durationMinutes ?? Math.max(1, (plannedKm / 25) * 60);

    const surge = getSurgeMultiplier();
    const total = computeTariffTotal(tariff, plannedKm, plannedMin, surge);

    const deadlineMs = getMatchDeadlineSeconds() * 1000;

    const data: Prisma.OrderCreateInput = {
      client: { connect: { id: clientId } },
      ...(preferredDriverUserId
        ? { preferredDriver: { connect: { id: preferredDriverUserId } } }
        : {}),
      tariff: { connect: { id: tariff.id } },
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
      surgeMultiplier: surge,
      promoCode: promoCode?.trim() || null,
      plannedRouteDistanceKm: plannedKm,
      plannedRouteDurationMin: plannedMin,
      matchDeadlineAt: new Date(Date.now() + deadlineMs),
      ...(clientPreferences?.length
        ? { clientPreferences: clientPreferences as unknown as Prisma.InputJsonValue }
        : {}),
      ...(tariffName === 'DELIVERY'
        ? {
            deliverySenderName: deliverySenderName?.trim() || null,
            deliverySenderPhone: deliverySenderPhone?.trim() || null,
            deliveryRecipientName: deliveryRecipientName?.trim() || null,
            deliveryRecipientPhone: deliveryRecipientPhone?.trim() || null,
            ...(deliveryPayer ? { deliveryPayer } : {}),
          }
        : {}),
    };

    return prisma.order.create({
      data,
      include: {
        tariff: true,
        client: orderClientInclude,
      },
    });
  }

  async createFromAddresses(clientId: string, input: ResolveEndpointsInput & CreateOrderCoordOpts) {
    const { pickup, dropoff } = await this.resolveOrderEndpoints(input);
    const opts: CreateOrderCoordOpts = {
      paymentMethod: input.paymentMethod ?? 'CASH',
      promoCode: input.promoCode ?? null,
      tariffName: input.tariffName ?? 'ECONOMY',
    };
    if (input.preferredDriverUserId) {
      opts.preferredDriverUserId = input.preferredDriverUserId;
    }
    if (input.clientPreferences?.length) {
      opts.clientPreferences = input.clientPreferences;
    }
    if (input.deliverySenderName != null) opts.deliverySenderName = input.deliverySenderName;
    if (input.deliverySenderPhone != null) opts.deliverySenderPhone = input.deliverySenderPhone;
    if (input.deliveryRecipientName != null) opts.deliveryRecipientName = input.deliveryRecipientName;
    if (input.deliveryRecipientPhone != null) opts.deliveryRecipientPhone = input.deliveryRecipientPhone;
    if (input.deliveryPayer != null) opts.deliveryPayer = input.deliveryPayer;
    return this.createFromCoordinates(clientId, pickup, dropoff, opts);
  }

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: {
        tariff: true,
        client: orderClientInclude,
      },
    });
  }

  async findAll(
    status?: string,
    driverId?: string,
    options?: { unassignedOnly?: boolean }
  ) {
    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as OrderStatus;
    if (options?.unassignedOnly) {
      where.driverId = null;
    } else if (driverId) {
      where.driverId = driverId;
    }
    return prisma.order.findMany({
      where,
      include: {
        client: orderClientInclude,
        driver: {
          include: {
            user: { select: driverUserPublicSelect },
            vehicle: true,
          },
        },
        tariff: true,
        reviews: { select: { id: true, authorId: true, rating: true, subjectUserId: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllForClient(clientId: string, status?: string) {
    const where: Prisma.OrderWhereInput = { clientId };
    if (status) where.status = status as OrderStatus;
    return prisma.order.findMany({
      where,
      include: {
        client: orderClientInclude,
        driver: { include: { user: { select: driverUserPublicSelect }, vehicle: true } },
        tariff: true,
        reviews: { select: { id: true, authorId: true, rating: true, subjectUserId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        client: orderClientInclude,
        driver: {
          include: {
            user: { select: driverUserPublicSelect },
            vehicle: true,
          },
        },
        tariff: true,
        transaction: true,
        reviews: {
          include: {
            author: { select: { id: true, fullName: true, role: true } },
            subject: { select: { id: true, fullName: true } },
          },
        },
        chat: true,
      },
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        tariff: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.order.delete({
      where: { id },
    });
  }
}
