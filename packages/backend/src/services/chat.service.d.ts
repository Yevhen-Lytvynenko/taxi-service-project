import { Prisma } from '@prisma/client';
/** Один запис у полі Chat.history (Json-масив). */
export type TripChatMessageJson = {
    id: string;
    role: 'CLIENT' | 'DRIVER';
    text: string;
    sentAt: string;
};
export declare class ChatService {
    create(data: Prisma.ChatCreateInput): Promise<{
        order: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    }>;
    /** Створює порожній чат для замовлення, якщо ще немає (один чат на поїздку). */
    ensureForOrder(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    }>;
    findByOrderId(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    } | null>;
    buildMessage(role: 'CLIENT' | 'DRIVER', text: string): TripChatMessageJson;
    addMessage(chatId: string, message: TripChatMessageJson): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    }>;
    /** Адмінка: останні чати з учасниками замовлення. */
    findRecentForStaff(limit?: number): Promise<({
        order: {
            client: {
                id: string;
                phone: string;
                fullName: string;
            };
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            pickupAddress: string;
            dropoffAddress: string;
            driver: {
                user: {
                    phone: string;
                    fullName: string;
                };
                id: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        history: Prisma.JsonValue;
    })[]>;
}
//# sourceMappingURL=chat.service.d.ts.map