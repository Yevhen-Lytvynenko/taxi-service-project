import { ContactListKind } from '@prisma/client';
export declare class UserContactService {
    list(ownerId: string, kind?: ContactListKind): Promise<({
        peer: {
            driverProfile: {
                vehicle: {
                    model: string;
                    plateNumber: string;
                } | null;
                id: string;
            } | null;
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
    } & {
        id: string;
        createdAt: Date;
        ownerId: string;
        peerId: string;
        kind: import(".prisma/client").$Enums.ContactListKind;
    })[]>;
    add(ownerId: string, peerId: string, kind: ContactListKind): Promise<{
        peer: {
            id: string;
            role: import(".prisma/client").$Enums.Role;
            phone: string;
            fullName: string;
            rating: number;
        };
    } & {
        id: string;
        createdAt: Date;
        ownerId: string;
        peerId: string;
        kind: import(".prisma/client").$Enums.ContactListKind;
    }>;
    remove(ownerId: string, peerId: string, kind: ContactListKind): Promise<void>;
    /** Профілі водіїв, яких не варто залучати до замовлення клієнта. */
    getExcludedDriverProfileIdsForClient(clientUserId: string): Promise<Set<string>>;
}
//# sourceMappingURL=userContact.service.d.ts.map