"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = exports.TARIFF_UI_UK = exports.CLIENT_APP_QUOTE_TARIFFS = void 0;
const geocode_service_1 = require("./geocode.service");
const route_service_1 = require("./route.service");
const library_1 = require("@prisma/client/runtime/library");
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
/** Спрощення полілінії для клієнтської мапи (менше точок — швидший WebView). */
function subsampleRouteCoords(coords, maxPoints) {
    if (coords.length <= maxPoints)
        return coords;
    const out = [];
    const step = (coords.length - 1) / (maxPoints - 1);
    for (let i = 0; i < maxPoints; i++) {
        const idx = Math.round(i * step);
        out.push(coords[Math.min(idx, coords.length - 1)]);
    }
    return out;
}
const CAR_ORDER = [
    'ECONOMY',
    'STANDARD',
    'COMFORT',
    'BUSINESS',
    'MINIVAN',
    'DELIVERY',
    'EXPRESS',
];
/** Тарифи в застосунку клієнта: економ, стандарт, комфорт, швидкий пошук, доставка. */
exports.CLIENT_APP_QUOTE_TARIFFS = [
    'ECONOMY',
    'STANDARD',
    'COMFORT',
    'EXPRESS',
    'DELIVERY',
];
/** Підписи тарифів для клієнтських застосунків (українською), у дусі UKLON. */
exports.TARIFF_UI_UK = {
    ECONOMY: { title: 'Економ', subtitle: 'Найнижча ціна по місту' },
    STANDARD: { title: 'Стандарт', subtitle: 'Баланс ціни та комфорту' },
    COMFORT: { title: 'Комфорт', subtitle: 'Авто вищого класу' },
    BUSINESS: { title: 'Бізнес', subtitle: 'Для ділових поїздок' },
    MINIVAN: { title: 'Мінівен', subtitle: 'До 7 пасажирів або багажу' },
    DELIVERY: { title: 'Доставка', subtitle: 'Кур’єр: відправник → отримувач' },
    EXPRESS: { title: 'Швидкий пошук', subtitle: 'Пріоритет у черзі водіїв' },
};
function computeTariffTotal(tariff, plannedKm, plannedMin, surge) {
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
};
const driverUserPublicSelect = {
    id: true,
    fullName: true,
    phone: true,
};
class OrderService {
    async resolveOrderEndpoints(input) {
        const pa = input.pickupAddress.trim();
        const da = input.dropoffAddress.trim();
        if (!pa || !da) {
            throw new Error('Вкажіть адреси відправлення та призначення');
        }
        let pickup;
        if (typeof input.pickupLat === 'number' && typeof input.pickupLng === 'number') {
            pickup = { lat: input.pickupLat, lng: input.pickupLng, displayName: pa };
        }
        else {
            const g = await (0, geocode_service_1.geocodeAddress)(pa);
            if (!g)
                throw new Error('Не вдалося знайти адресу відправлення');
            pickup = {
                lat: g.lat,
                lng: g.lng,
                displayName: g.shortLabel || g.displayName,
            };
        }
        let dropoff;
        if (typeof input.dropoffLat === 'number' && typeof input.dropoffLng === 'number') {
            dropoff = { lat: input.dropoffLat, lng: input.dropoffLng, displayName: da };
        }
        else {
            const g = await (0, geocode_service_1.geocodeAddress)(da);
            if (!g)
                throw new Error('Не вдалося знайти адресу призначення');
            dropoff = {
                lat: g.lat,
                lng: g.lng,
                displayName: g.shortLabel || g.displayName,
            };
        }
        return { pickup, dropoff };
    }
    async quoteTripEndpoints(pickup, dropoff, opts) {
        const distanceKm = (0, geocode_service_1.haversineDistanceKm)(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        const route = await (0, route_service_1.getRoute)({ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng });
        const plannedKm = route?.distanceKm ?? distanceKm;
        const plannedMin = route?.durationMinutes ?? Math.max(1, (plannedKm / 25) * 60);
        const surge = (0, env_1.getSurgeMultiplier)();
        const tariffs = await prisma_1.prisma.tariff.findMany();
        const codeOrder = opts?.tariffCodes && opts.tariffCodes.length > 0 ? opts.tariffCodes : CAR_ORDER;
        const sorted = codeOrder.map((code) => tariffs.find((t) => t.name === code)).filter((t) => !!t);
        const routePolyline = route?.coordinates && route.coordinates.length >= 2
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
                title: exports.TARIFF_UI_UK[t.name].title,
                subtitle: exports.TARIFF_UI_UK[t.name].subtitle,
                totalPrice: computeTariffTotal(t, plannedKm, plannedMin, surge),
            })),
        };
    }
    async createFromCoordinates(clientId, pickup, dropoff, opts = {}) {
        const { paymentMethod = 'CASH', promoCode, preferredDriverUserId, tariffName = 'ECONOMY', clientPreferences, deliverySenderName, deliverySenderPhone, deliveryRecipientName, deliveryRecipientPhone, deliveryPayer, } = opts;
        const distanceKm = (0, geocode_service_1.haversineDistanceKm)(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        const tariff = await prisma_1.prisma.tariff.findUnique({
            where: { name: tariffName },
        });
        if (!tariff)
            throw new Error(`Тариф ${tariffName} не знайдено. Запустіть seed.`);
        const route = await (0, route_service_1.getRoute)({ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng });
        const plannedKm = route?.distanceKm ?? distanceKm;
        const plannedMin = route?.durationMinutes ?? Math.max(1, (plannedKm / 25) * 60);
        const surge = (0, env_1.getSurgeMultiplier)();
        const total = computeTariffTotal(tariff, plannedKm, plannedMin, surge);
        const deadlineMs = (0, env_1.getMatchDeadlineSeconds)() * 1000;
        const data = {
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
            totalPrice: new library_1.Decimal(total),
            paymentMethod,
            status: 'SEARCHING',
            surgeMultiplier: surge,
            promoCode: promoCode?.trim() || null,
            plannedRouteDistanceKm: plannedKm,
            plannedRouteDurationMin: plannedMin,
            matchDeadlineAt: new Date(Date.now() + deadlineMs),
            ...(clientPreferences?.length
                ? { clientPreferences: clientPreferences }
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
        return prisma_1.prisma.order.create({
            data,
            include: {
                tariff: true,
                client: orderClientInclude,
            },
        });
    }
    async createFromAddresses(clientId, input) {
        const { pickup, dropoff } = await this.resolveOrderEndpoints(input);
        const opts = {
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
        if (input.deliverySenderName != null)
            opts.deliverySenderName = input.deliverySenderName;
        if (input.deliverySenderPhone != null)
            opts.deliverySenderPhone = input.deliverySenderPhone;
        if (input.deliveryRecipientName != null)
            opts.deliveryRecipientName = input.deliveryRecipientName;
        if (input.deliveryRecipientPhone != null)
            opts.deliveryRecipientPhone = input.deliveryRecipientPhone;
        if (input.deliveryPayer != null)
            opts.deliveryPayer = input.deliveryPayer;
        return this.createFromCoordinates(clientId, pickup, dropoff, opts);
    }
    async create(data) {
        return prisma_1.prisma.order.create({
            data,
            include: {
                tariff: true,
                client: orderClientInclude,
            },
        });
    }
    async findAll(status, driverId, options) {
        const where = {};
        if (status)
            where.status = status;
        if (options?.unassignedOnly) {
            where.driverId = null;
        }
        else if (driverId) {
            where.driverId = driverId;
        }
        return prisma_1.prisma.order.findMany({
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
    async findAllForClient(clientId, status) {
        const where = { clientId };
        if (status)
            where.status = status;
        return prisma_1.prisma.order.findMany({
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
    async findById(id) {
        return prisma_1.prisma.order.findUnique({
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
    async update(id, data) {
        return prisma_1.prisma.order.update({
            where: { id },
            data,
            include: {
                tariff: true,
            },
        });
    }
    async delete(id) {
        return prisma_1.prisma.order.delete({
            where: { id },
        });
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map