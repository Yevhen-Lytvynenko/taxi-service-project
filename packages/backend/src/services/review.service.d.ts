export declare class ReviewService {
    /** Клієнт оцінює водія після завершеного замовлення. */
    createClientReview(clientUserId: string, orderId: string, rating: number, comment?: string | null): Promise<{
        driver: {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: import("@prisma/client/runtime/library").Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        } | null;
        author: {
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
    }>;
    /** Водій оцінює клієнта. */
    createDriverReview(driverUserId: string, driverProfileId: string, orderId: string, rating: number, comment?: string | null): Promise<{
        author: {
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
    }>;
    findAll(): Promise<({
        order: {
            id: string;
            pickupAddress: string;
        };
        driver: ({
            user: {
                fullName: string;
            };
        } & {
            id: string;
            userId: string;
            licenseNumber: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            balance: import("@prisma/client/runtime/library").Decimal;
            currentLat: number | null;
            currentLng: number | null;
            lastActive: Date;
            verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus;
        }) | null;
        author: {
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
        subject: {
            phone: string;
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
    })[]>;
    findBySubjectUserId(subjectUserId: string): Promise<({
        order: {
            id: string;
            pickupAddress: string;
            dropoffAddress: string;
            finishedAt: Date | null;
        };
        author: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
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
    })[]>;
    findByDriverId(driverId: string): Promise<({
        author: {
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
        subject: {
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
    })[]>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=review.service.d.ts.map