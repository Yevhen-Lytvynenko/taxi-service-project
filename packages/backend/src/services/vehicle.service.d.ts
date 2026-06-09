import { Prisma } from '@prisma/client';
export declare class VehicleService {
    create(data: Prisma.VehicleCreateInput): Promise<{
        driver: {
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
        model: string;
        id: string;
        driverId: string;
        color: string;
        plateNumber: string;
        productionYear: number;
        carClass: import(".prisma/client").$Enums.CarClass;
        odometerKm: number | null;
    }>;
    findAll(): Promise<({
        driver: {
            user: {
                id: string;
                role: import(".prisma/client").$Enums.Role;
                username: string | null;
                phone: string;
                email: string | null;
                password: string;
                fullName: string;
                avatarUrl: string | null;
                officeRoleId: string | null;
                rating: number;
                pushToken: string | null;
                createdAt: Date;
                updatedAt: Date;
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
        model: string;
        id: string;
        driverId: string;
        color: string;
        plateNumber: string;
        productionYear: number;
        carClass: import(".prisma/client").$Enums.CarClass;
        odometerKm: number | null;
    })[]>;
    findById(id: string): Promise<({
        driver: {
            user: {
                id: string;
                role: import(".prisma/client").$Enums.Role;
                username: string | null;
                phone: string;
                email: string | null;
                password: string;
                fullName: string;
                avatarUrl: string | null;
                officeRoleId: string | null;
                rating: number;
                pushToken: string | null;
                createdAt: Date;
                updatedAt: Date;
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
        model: string;
        id: string;
        driverId: string;
        color: string;
        plateNumber: string;
        productionYear: number;
        carClass: import(".prisma/client").$Enums.CarClass;
        odometerKm: number | null;
    }) | null>;
    update(id: string, data: Prisma.VehicleUpdateInput): Promise<{
        model: string;
        id: string;
        driverId: string;
        color: string;
        plateNumber: string;
        productionYear: number;
        carClass: import(".prisma/client").$Enums.CarClass;
        odometerKm: number | null;
    }>;
    delete(id: string): Promise<{
        model: string;
        id: string;
        driverId: string;
        color: string;
        plateNumber: string;
        productionYear: number;
        carClass: import(".prisma/client").$Enums.CarClass;
        odometerKm: number | null;
    }>;
}
//# sourceMappingURL=vehicle.service.d.ts.map