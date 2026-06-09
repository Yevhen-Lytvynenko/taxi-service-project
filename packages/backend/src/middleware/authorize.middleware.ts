import { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

/** Усі ролі персоналу адмін-панелі (включно з бухгалтером). */
export const OFFICE_ROLES: Role[] = ['DISPATCHER', 'MANAGER', 'ADMIN', 'ACCOUNTANT'];

/** Операційний персонал без бухгалтера (диспетчеризація, чати, GPS тощо). */
export const OPERATIONS_ROLES: Role[] = ['DISPATCHER', 'MANAGER', 'ADMIN'];

/** Фінансові звіти, транзакції та тарифи (лише адмін і бухгалтер). */
export const FINANCE_ROLES: Role[] = ['ADMIN', 'ACCOUNTANT'];

/** Мутації замовлень з панелі (диспетчеризація): без бухгалтера. */
export const ORDER_DISPATCH_ROLES: Role[] = ['DISPATCHER', 'MANAGER', 'ADMIN'];

/** @deprecated Використовуйте OFFICE_ROLES */
export const STAFF_ROLES: Role[] = OFFICE_ROLES;

export function isOfficeRole(role: string | undefined): boolean {
  return !!role && OFFICE_ROLES.includes(role as Role);
}

export function isOperationsRole(role: string | undefined): boolean {
  return !!role && OPERATIONS_ROLES.includes(role as Role);
}

export function isFinanceRole(role: string | undefined): boolean {
  return !!role && FINANCE_ROLES.includes(role as Role);
}

export function isOrderDispatchRole(role: string | undefined): boolean {
  return !!role && ORDER_DISPATCH_ROLES.includes(role as Role);
}

/** Будь-хто з доступом до адмін-панелі (включно з бухгалтером). */
export function isStaffRole(role: string | undefined): boolean {
  return isOfficeRole(role);
}

/** Staff (dispatcher / manager / admin / accountant) для колишньої семантики «офіс». */
export function requireOfficeStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isOfficeRole(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

/** Операційний персонал лише (без бухгалтера). */
export function requireOperationsStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isOperationsRole(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

/** Адмін і бухгалтер — транзакції й фінансові звіти. */
export function requireFinanceStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isFinanceRole(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

/** Alias для зворотної сумісності з роутами, де раніше був «staff». */
export function requireStaff(req: Request, res: Response, next: NextFunction) {
  return requireOfficeStaff(req, res, next);
}

/** Same user as :id param, або операційний персонал (не бухгалтер для чужих профілів). */
export function requireSelfOrStaff(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const targetId = req.params[paramName];
    if (isOperationsRole(req.user.role) || req.user.id === targetId) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

/** Водій бачить себе; операційний персонал — будь-кого; бухгалтер — лише GET чужого профілю водія. */
export function requireDriverSelfOrStaff(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const targetDriverProfileId = req.params[paramName];
    if (isOperationsRole(req.user.role)) {
      return next();
    }
    if (req.user.role === 'ACCOUNTANT' && req.method === 'GET') {
      return next();
    }
    if (req.user.role === 'DRIVER' && req.user.driverId === targetDriverProfileId) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

/** Фінансовий персонал або водій за своїм driverId. */
export function requireFinanceStaffOrOwnDriver(driverIdParam = 'driverId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const target = req.params[driverIdParam];
    if (req.user.role === 'DRIVER' && req.user.driverId === target) {
      return next();
    }
    if (isFinanceRole(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

/** Диспетчеризація замовлень (панель): диспетчер, менеджер, адмін — не бухгалтер. */
export function requireOrderDispatchStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isOrderDispatchRole(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}
