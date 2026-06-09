import { CarClass, DeliveryPayer, Prisma } from '@prisma/client';
/** Тарифи в застосунку клієнта: економ, стандарт, комфорт, швидкий пошук, доставка. */
export declare const CLIENT_APP_QUOTE_TARIFFS: CarClass[];
/** Підписи тарифів для клієнтських застосунків (українською), у дусі UKLON. */
export declare const TARIFF_UI_UK: Record<CarClass, {
    title: string;
    subtitle: string;
}>;
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
export interface CoordinatePoint {
    lat: number;
    lng: number;
    displayName: string;
}
export declare class OrderService {
    resolveOrderEndpoints(input: ResolveEndpointsInput): Promise<{
        pickup: CoordinatePoint;
        dropoff: CoordinatePoint;
    }>;
    quoteTripEndpoints(pickup: {
        lat: number;
        lng: number;
    }, dropoff: {
        lat: number;
        lng: number;
    }, opts?: {
        tariffCodes?: CarClass[];
    }): Promise<{
        distanceKm: number;
        plannedRouteDistanceKm: number;
        plannedRouteDurationMin: number;
        surgeMultiplier: number;
        routePolyline: [number, number][] | null;
        tariffs: {
            code: import(".prisma/client").$Enums.CarClass;
            title: string;
            subtitle: string;
            totalPrice: number;
        }[];
    }>;
    createFromCoordinates(clientId: string, pickup: CoordinatePoint, dropoff: CoordinatePoint, opts?: CreateOrderCoordOpts): Promise<{
        client: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    createFromAddresses(clientId: string, input: ResolveEndpointsInput & CreateOrderCoordOpts): Promise<{
        client: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    create(data: Prisma.OrderCreateInput): Promise<{
        client: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    findAll(status?: string, driverId?: string, options?: {
        unassignedOnly?: boolean;
    }): Promise<({
        reviews: {
            id: string;
            rating: number;
            authorId: string;
            subjectUserId: string;
        }[];
        client: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
        driver: ({
            user: {
                id: string;
                phone: string;
                fullName: string;
            };
            vehicle: {
                model: string;
                id: string;
                driverId: string;
                color: string;
                plateNumber: string;
                productionYear: number;
                carClass: import(".prisma/client").$Enums.CarClass;
                odometerKm: number | null;
            } | null;
        } & {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        }) | null;
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    })[]>;
    findAllForClient(clientId: string, status?: string): Promise<({
        reviews: {
            id: string;
            rating: number;
            authorId: string;
            subjectUserId: string;
        }[];
        client: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
        driver: ({
            user: {
                id: string;
                phone: string;
                fullName: string;
            };
            vehicle: {
                model: string;
                id: string;
                driverId: string;
                color: string;
                plateNumber: string;
                productionYear: number;
                carClass: import(".prisma/client").$Enums.CarClass;
                odometerKm: number | null;
            } | null;
        } & {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        }) | null;
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    })[]>;
    findById(id: string): Promise<({
        reviews: ({
            author: {
                id: string;
                role: import(".prisma/client").$Enums.Role;
                fullName: string;
            };
            subject: {
                id: string;
                fullName: string;
            };
        } & {
            id: string;
            driverId: string | null;
            rating: number;
            createdAt: Date;
            orderId: string;
            authorId: string;
            subjectUserId: string;
            comment: string | null;
        })[];
        client: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
        chat: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            history: Prisma.JsonValue;
        } | null;
        transaction: {
            id: string;
            driverId: string;
            createdAt: Date;
            orderId: string | null;
            amount: Prisma.Decimal;
            type: string;
        } | null;
        driver: ({
            user: {
                id: string;
                phone: string;
                fullName: string;
            };
            vehicle: {
                model: string;
                id: string;
                driverId: string;
                color: string;
                plateNumber: string;
                productionYear: number;
                carClass: import(".prisma/client").$Enums.CarClass;
                odometerKm: number | null;
            } | null;
        } & {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        }) | null;
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }) | null>;
    update(id: string, data: Prisma.OrderUpdateInput): Promise<{
        tariff: {
            id: string;
            name: import(".prisma/client").$Enums.CarClass;
            basePrice: Prisma.Decimal;
            pricePerKm: Prisma.Decimal;
            pricePerMin: Prisma.Decimal;
            minPrice: Prisma.Decimal;
        };
    } & {
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        driverId: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        clientId: string;
        tariffId: string;
        pickupAddress: string;
        pickupLat: number;
        pickupLng: number;
        dropoffAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        distanceKm: number;
        totalPrice: Prisma.Decimal;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        surgeMultiplier: number;
        clientPreferences: Prisma.JsonValue | null;
        promoCode: string | null;
        plannedRouteDistanceKm: number | null;
        plannedRouteDurationMin: number | null;
        plannedRoutePolyline: Prisma.JsonValue | null;
        navigationRouteToPickup: Prisma.JsonValue | null;
        navigationRouteToDropoff: Prisma.JsonValue | null;
        actualRouteDistanceKm: number | null;
        platformFeeAmount: Prisma.Decimal | null;
        driverEarningAmount: Prisma.Decimal | null;
        matchDeadlineAt: Date | null;
        deliverySenderName: string | null;
        deliverySenderPhone: string | null;
        deliveryRecipientName: string | null;
        deliveryRecipientPhone: string | null;
        deliveryPayer: import(".prisma/client").$Enums.DeliveryPayer | null;
        preferredDriverUserId: string | null;
        dispatcherNotes: string | null;
        cancelledByRole: import(".prisma/client").$Enums.Role | null;
        cancellationReason: import(".prisma/client").$Enums.CancellationReason | null;
        startedAt: Date | null;
        finishedAt: Date | null;
    }>;
}
//# sourceMappingURL=order.service.d.ts.map