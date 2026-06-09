import { Server } from 'socket.io';
import { DriverStatus } from '@prisma/client';
interface LocationUpdate {
    driverId: string;
    lat: number;
    lng: number;
    status?: DriverStatus;
    /** When set, ties the GPS point to an active trip for route analytics. */
    orderId?: string;
}
export type GpsSimDriverSyncPayload = {
    driverId: string;
    status: 'ONLINE' | 'BUSY';
    lat?: number;
    lng?: number;
};
export declare class SocketService {
    private io;
    /** Прореживання записів у БД: сокет і driver_moved лишаються частими. */
    private lastPersistedLocation;
    private static readonly LOC_LOG_MIN_INTERVAL_MS;
    private static readonly LOC_LOG_MIN_DISTANCE_M;
    constructor(io: Server);
    private initialize;
    processLocationUpdate(data: LocationUpdate): Promise<void>;
    notifyDriverNewOrder(driverId: string, order: any): void;
    notifyOrderStatus(orderId: string, status: string): void;
    /** Оновлення навігаційної полілінії (ноги поїздки) для клієнта та водія в кімнаті замовлення. */
    notifyOrderRouteUpdated(orderId: string, payload: {
        leg: 'TO_PICKUP' | 'TO_DROPOFF';
        /** [lng, lat][] як у БД / Directions */
        coordinates: Array<[number, number]>;
        distanceKm?: number;
        durationMin?: number;
    }): void;
    /** Нове повідомлення в чаті поїздки (history у БД — Json). */
    notifyOrderChatMessage(orderId: string, payload: {
        message: {
            id: string;
            role: string;
            text: string;
            sentAt: string;
        };
        historyLength: number;
    }): void;
    /** Черга водіїв: прибрати замовлення зі списку SEARCHING (скасування клієнтом). */
    broadcastOrderCancelled(orderId: string): void;
    notifyAdminOrderUpdate(order: any): void;
    /** GPS demo process: keep in-memory driver state aligned (cruise vs order leg). */
    syncGpsSimulatorDriver(payload: GpsSimDriverSyncPayload): void;
}
export {};
//# sourceMappingURL=socket.service.d.ts.map