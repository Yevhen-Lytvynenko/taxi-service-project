import { Prisma } from '@prisma/client';
export declare class TariffService {
    create(data: Prisma.TariffCreateInput): Promise<{
        id: string;
        name: import(".prisma/client").$Enums.CarClass;
        basePrice: Prisma.Decimal;
        pricePerKm: Prisma.Decimal;
        pricePerMin: Prisma.Decimal;
        minPrice: Prisma.Decimal;
    }>;
    findAll(): Promise<{
        id: string;
        name: import(".prisma/client").$Enums.CarClass;
        basePrice: Prisma.Decimal;
        pricePerKm: Prisma.Decimal;
        pricePerMin: Prisma.Decimal;
        minPrice: Prisma.Decimal;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        name: import(".prisma/client").$Enums.CarClass;
        basePrice: Prisma.Decimal;
        pricePerKm: Prisma.Decimal;
        pricePerMin: Prisma.Decimal;
        minPrice: Prisma.Decimal;
    } | null>;
    findByName(name: any): Promise<{
        id: string;
        name: import(".prisma/client").$Enums.CarClass;
        basePrice: Prisma.Decimal;
        pricePerKm: Prisma.Decimal;
        pricePerMin: Prisma.Decimal;
        minPrice: Prisma.Decimal;
    } | null>;
    update(id: string, data: Prisma.TariffUpdateInput): Promise<{
        id: string;
        name: import(".prisma/client").$Enums.CarClass;
        basePrice: Prisma.Decimal;
        pricePerKm: Prisma.Decimal;
        pricePerMin: Prisma.Decimal;
        minPrice: Prisma.Decimal;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: import(".prisma/client").$Enums.CarClass;
        basePrice: Prisma.Decimal;
        pricePerKm: Prisma.Decimal;
        pricePerMin: Prisma.Decimal;
        minPrice: Prisma.Decimal;
    }>;
}
//# sourceMappingURL=tariff.service.d.ts.map