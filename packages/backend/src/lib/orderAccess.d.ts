import type { JwtUserPayload } from '../types/jwt-user';
/** Перегляд замовлення: будь-який офіс, клієнт або водій по призначенню. */
export declare function assertOrderAccess(orderId: string, user: JwtUserPayload): Promise<void>;
//# sourceMappingURL=orderAccess.d.ts.map