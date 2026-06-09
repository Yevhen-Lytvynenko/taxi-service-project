import { Prisma } from '@prisma/client';
export declare class LocationService {
    create(data: Prisma.LocationLogCreateInput): Promise<{
        id: string;
        driverId: string;
        timestamp: Date;
        orderId: string | null;
        lat: number;
        lng: number;
        speed: number | null;
    }>;
    getDriverHistory(driverId: string, from: Date, to: Date): Promise<{
        id: string;
        driverId: string;
        timestamp: Date;
        orderId: string | null;
        lat: number;
        lng: number;
        speed: number | null;
    }[]>;
    /** Адмінка: останні точки всіх водіїв (для демо-таблиці без вибору водія). */
    getRecentLogs(limit?: number): Promise<({
        order: {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
        } | null;
        driver: {
            user: {
                phone: string;
                fullName: string;
            };
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
        };
    } & {
        id: string;
        driverId: string;
        timestamp: Date;
        orderId: string | null;
        lat: number;
        lng: number;
        speed: number | null;
    })[]>;
    private readonly GRID_SIZE;
    getHeatmapData(from: Date, to: Date, type: 'pickup' | 'dropoff' | 'both'): Promise<{
        latitude: number;
        longitude: number;
        weight: number;
    }[]>;
}
//# sourceMappingURL=location.service.d.ts.map