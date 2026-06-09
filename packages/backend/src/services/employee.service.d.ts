import { Prisma } from '@prisma/client';
export declare class EmployeeService {
    create(data: Prisma.EmployeeProfileCreateInput): Promise<{
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
        department: string;
        salary: Prisma.Decimal | null;
        hireDate: Date;
    }>;
    findAll(): Promise<({
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
        department: string;
        salary: Prisma.Decimal | null;
        hireDate: Date;
    })[]>;
    update(id: string, data: Prisma.EmployeeProfileUpdateInput): Promise<{
        id: string;
        userId: string;
        department: string;
        salary: Prisma.Decimal | null;
        hireDate: Date;
    }>;
    delete(id: string): Promise<{
        id: string;
        userId: string;
        department: string;
        salary: Prisma.Decimal | null;
        hireDate: Date;
    }>;
}
//# sourceMappingURL=employee.service.d.ts.map