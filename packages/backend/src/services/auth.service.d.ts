export declare class AuthService {
    login(phone: string, password: string): Promise<{
        token: string;
        user: {
            officeRole: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                displayName: string;
                legacyRole: import(".prisma/client").$Enums.Role;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            driverProfile: {
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
            employeeProfile: {
                id: string;
                userId: string;
                department: string;
                salary: import("@prisma/client/runtime/library").Decimal | null;
                hireDate: Date;
            } | null;
            id: string;
            role: import(".prisma/client").$Enums.Role;
            username: string | null;
            phone: string;
            email: string | null;
            fullName: string;
            avatarUrl: string | null;
            officeRoleId: string | null;
            rating: number;
            pushToken: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    loginByUsername(username: string, password: string): Promise<{
        token: string;
        user: {
            officeRole: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                displayName: string;
                legacyRole: import(".prisma/client").$Enums.Role;
                isSystem: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue;
            } | null;
            driverProfile: {
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
            employeeProfile: {
                id: string;
                userId: string;
                department: string;
                salary: import("@prisma/client/runtime/library").Decimal | null;
                hireDate: Date;
            } | null;
            id: string;
            role: import(".prisma/client").$Enums.Role;
            username: string | null;
            phone: string;
            email: string | null;
            fullName: string;
            avatarUrl: string | null;
            officeRoleId: string | null;
            rating: number;
            pushToken: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getProfile(userId: string): Promise<{
        officeRole: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            displayName: string;
            legacyRole: import(".prisma/client").$Enums.Role;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        driverProfile: {
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
        employeeProfile: {
            id: string;
            userId: string;
            department: string;
            salary: import("@prisma/client/runtime/library").Decimal | null;
            hireDate: Date;
        } | null;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        username: string | null;
        phone: string;
        email: string | null;
        fullName: string;
        avatarUrl: string | null;
        officeRoleId: string | null;
        rating: number;
        pushToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updatePushToken(userId: string, pushToken: string | null): Promise<{
        officeRole: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            displayName: string;
            legacyRole: import(".prisma/client").$Enums.Role;
            isSystem: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        } | null;
        driverProfile: {
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
        employeeProfile: {
            id: string;
            userId: string;
            department: string;
            salary: import("@prisma/client/runtime/library").Decimal | null;
            hireDate: Date;
        } | null;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        username: string | null;
        phone: string;
        email: string | null;
        fullName: string;
        avatarUrl: string | null;
        officeRoleId: string | null;
        rating: number;
        pushToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map