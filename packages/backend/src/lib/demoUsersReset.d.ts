import type { PrismaClient } from '@prisma/client';
/** Демо для презентації: один клієнт + один водій (логін/пароль див. seed). */
export declare const DEMO_SHOWCASE_CLIENT_PHONE = "+380991111111";
export declare const DEMO_SHOWCASE_DRIVER_PHONE = "+380992222222";
/**
 * Очищає історію замовлень, відгуків, чатів, транзакцій і треків для демо-пари;
 * скидає рейтинги на 5.0 і баланс водія на 0.
 * Викликати після seed або при старті бекенду (DEMO_RESET_ON_START).
 */
export declare function resetPresentationDemoUsers(db: PrismaClient): Promise<void>;
export declare function isDemoResetOnStartEnabled(): boolean;
//# sourceMappingURL=demoUsersReset.d.ts.map