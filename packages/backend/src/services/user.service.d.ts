import { Prisma } from '@prisma/client';
type UpdateBody = Prisma.UserUpdateInput & {
    officeRoleId?: string | null;
};
export declare class UserService {
    create(data: Prisma.UserCreateInput & {
        officeRoleId?: string | null;
    }): Promise<{
        officeRole: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            displayName: string;
            legacyRole: import(".prisma/client").$Enums.Role;
            isSystem: boolean;
            permissions: Prisma.JsonValue;
        } | null;
        driverProfile: {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        } | null;
        employeeProfile: {
            id: string;
            userId: string;
            department: string;
            salary: Prisma.Decimal | null;
            hireDate: Date;
        } | null;
    } & {
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
    }>;
    findAll(): Promise<({
        officeRole: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            displayName: string;
            legacyRole: import(".prisma/client").$Enums.Role;
            isSystem: boolean;
            permissions: Prisma.JsonValue;
        } | null;
        driverProfile: {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        } | null;
        employeeProfile: {
            id: string;
            userId: string;
            department: string;
            salary: Prisma.Decimal | null;
            hireDate: Date;
        } | null;
        clientOrders: {
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
        }[];
    } & {
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
    })[]>;
    findById(id: string): Promise<({
        officeRole: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            displayName: string;
            legacyRole: import(".prisma/client").$Enums.Role;
            isSystem: boolean;
            permissions: Prisma.JsonValue;
        } | null;
        driverProfile: {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        } | null;
        employeeProfile: {
            id: string;
            userId: string;
            department: string;
            salary: Prisma.Decimal | null;
            hireDate: Date;
        } | null;
        clientOrders: {
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
        }[];
    } & {
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
    }) | null>;
    update(id: string, data: UpdateBody): Promise<{
        officeRole: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            displayName: string;
            legacyRole: import(".prisma/client").$Enums.Role;
            isSystem: boolean;
            permissions: Prisma.JsonValue;
        } | null;
        driverProfile: {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: Prisma.Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        } | null;
        employeeProfile: {
            id: string;
            userId: string;
            department: string;
            salary: Prisma.Decimal | null;
            hireDate: Date;
        } | null;
    } & {
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
    }>;
    delete(id: string): Promise<{
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
    }>;
}
export {};
//# sourceMappingURL=user.service.d.ts.map