"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAFF_ROLES = exports.ORDER_DISPATCH_ROLES = exports.FINANCE_ROLES = exports.OPERATIONS_ROLES = exports.OFFICE_ROLES = void 0;
exports.isOfficeRole = isOfficeRole;
exports.isOperationsRole = isOperationsRole;
exports.isFinanceRole = isFinanceRole;
exports.isOrderDispatchRole = isOrderDispatchRole;
exports.isStaffRole = isStaffRole;
exports.requireOfficeStaff = requireOfficeStaff;
exports.requireOperationsStaff = requireOperationsStaff;
exports.requireFinanceStaff = requireFinanceStaff;
exports.requireStaff = requireStaff;
exports.requireSelfOrStaff = requireSelfOrStaff;
exports.requireDriverSelfOrStaff = requireDriverSelfOrStaff;
exports.requireFinanceStaffOrOwnDriver = requireFinanceStaffOrOwnDriver;
exports.requireOrderDispatchStaff = requireOrderDispatchStaff;
/** Усі ролі персоналу адмін-панелі (включно з бухгалтером). */
exports.OFFICE_ROLES = ['DISPATCHER', 'MANAGER', 'ADMIN', 'ACCOUNTANT'];
/** Операційний персонал без бухгалтера (диспетчеризація, чати, GPS тощо). */
exports.OPERATIONS_ROLES = ['DISPATCHER', 'MANAGER', 'ADMIN'];
/** Фінансові звіти, транзакції та тарифи (лише адмін і бухгалтер). */
exports.FINANCE_ROLES = ['ADMIN', 'ACCOUNTANT'];
/** Мутації замовлень з панелі (диспетчеризація): без бухгалтера. */
exports.ORDER_DISPATCH_ROLES = ['DISPATCHER', 'MANAGER', 'ADMIN'];
/** @deprecated Використовуйте OFFICE_ROLES */
exports.STAFF_ROLES = exports.OFFICE_ROLES;
function isOfficeRole(role) {
    return !!role && exports.OFFICE_ROLES.includes(role);
}
function isOperationsRole(role) {
    return !!role && exports.OPERATIONS_ROLES.includes(role);
}
function isFinanceRole(role) {
    return !!role && exports.FINANCE_ROLES.includes(role);
}
function isOrderDispatchRole(role) {
    return !!role && exports.ORDER_DISPATCH_ROLES.includes(role);
}
/** Будь-хто з доступом до адмін-панелі (включно з бухгалтером). */
function isStaffRole(role) {
    return isOfficeRole(role);
}
/** Staff (dispatcher / manager / admin / accountant) для колишньої семантики «офіс». */
function requireOfficeStaff(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isOfficeRole(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}
/** Операційний персонал лише (без бухгалтера). */
function requireOperationsStaff(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isOperationsRole(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}
/** Адмін і бухгалтер — транзакції й фінансові звіти. */
function requireFinanceStaff(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isFinanceRole(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}
/** Alias для зворотної сумісності з роутами, де раніше був «staff». */
function requireStaff(req, res, next) {
    return requireOfficeStaff(req, res, next);
}
/** Same user as :id param, або операційний персонал (не бухгалтер для чужих профілів). */
function requireSelfOrStaff(paramName = 'id') {
    return (req, res, next) => {
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
function requireDriverSelfOrStaff(paramName = 'id') {
    return (req, res, next) => {
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
function requireFinanceStaffOrOwnDriver(driverIdParam = 'driverId') {
    return (req, res, next) => {
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
function requireOrderDispatchStaff(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isOrderDispatchRole(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
}
//# sourceMappingURL=authorize.middleware.js.map