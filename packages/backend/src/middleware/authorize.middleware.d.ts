import { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
/** Усі ролі персоналу адмін-панелі (включно з бухгалтером). */
export declare const OFFICE_ROLES: Role[];
/** Операційний персонал без бухгалтера (диспетчеризація, чати, GPS тощо). */
export declare const OPERATIONS_ROLES: Role[];
/** Фінансові звіти, транзакції та тарифи (лише адмін і бухгалтер). */
export declare const FINANCE_ROLES: Role[];
/** Мутації замовлень з панелі (диспетчеризація): без бухгалтера. */
export declare const ORDER_DISPATCH_ROLES: Role[];
/** @deprecated Використовуйте OFFICE_ROLES */
export declare const STAFF_ROLES: Role[];
export declare function isOfficeRole(role: string | undefined): boolean;
export declare function isOperationsRole(role: string | undefined): boolean;
export declare function isFinanceRole(role: string | undefined): boolean;
export declare function isOrderDispatchRole(role: string | undefined): boolean;
/** Будь-хто з доступом до адмін-панелі (включно з бухгалтером). */
export declare function isStaffRole(role: string | undefined): boolean;
/** Staff (dispatcher / manager / admin / accountant) для колишньої семантики «офіс». */
export declare function requireOfficeStaff(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/** Операційний персонал лише (без бухгалтера). */
export declare function requireOperationsStaff(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/** Адмін і бухгалтер — транзакції й фінансові звіти. */
export declare function requireFinanceStaff(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/** Alias для зворотної сумісності з роутами, де раніше був «staff». */
export declare function requireStaff(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/** Same user as :id param, або операційний персонал (не бухгалтер для чужих профілів). */
export declare function requireSelfOrStaff(paramName?: string): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/** Водій бачить себе; операційний персонал — будь-кого; бухгалтер — лише GET чужого профілю водія. */
export declare function requireDriverSelfOrStaff(paramName?: string): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/** Фінансовий персонал або водій за своїм driverId. */
export declare function requireFinanceStaffOrOwnDriver(driverIdParam?: string): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/** Диспетчеризація замовлень (панель): диспетчер, менеджер, адмін — не бухгалтер. */
export declare function requireOrderDispatchStaff(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authorize.middleware.d.ts.map