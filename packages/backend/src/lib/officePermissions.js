"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OFFICE_PERMISSION_KEYS = void 0;
exports.mergePermissionPatch = mergePermissionPatch;
exports.defaultPermissionsForLegacyRole = defaultPermissionsForLegacyRole;
exports.buildEffectivePermissions = buildEffectivePermissions;
exports.levelMeets = levelMeets;
exports.OFFICE_PERMISSION_KEYS = [
    'dashboard',
    'users',
    'clients',
    'drivers',
    'employees',
    'orders',
    'transactions',
    'chats',
    'reviews',
    'locations',
    'tariffs',
    'live',
    'analytics',
    'analytics_finance',
    'complaints',
    'audit',
    'roles_manage',
    'dispatch',
];
function all(level) {
    return Object.fromEntries(exports.OFFICE_PERMISSION_KEYS.map((k) => [k, level]));
}
function mergePermissionPatch(base, patch) {
    const out = { ...base };
    if (!patch || typeof patch !== 'object')
        return out;
    const p = patch;
    for (const k of exports.OFFICE_PERMISSION_KEYS) {
        const v = p[k];
        if (v === 'none' || v === 'read' || v === 'write')
            out[k] = v;
    }
    return out;
}
function defaultPermissionsForLegacyRole(role) {
    const n = all('none');
    const w = (keys) => {
        const x = { ...n };
        for (const k of keys)
            x[k] = 'write';
        return x;
    };
    switch (role) {
        case 'ADMIN':
            return all('write');
        case 'MANAGER': {
            const x = w([
                'dashboard',
                'clients',
                'drivers',
                'employees',
                'orders',
                'chats',
                'reviews',
                'locations',
                'tariffs',
                'live',
                'complaints',
                'dispatch',
                'roles_manage',
            ]);
            x.users = 'read';
            x.analytics = 'read';
            x.analytics_finance = 'read';
            return x;
        }
        case 'DISPATCHER':
            return w([
                'dashboard',
                'clients',
                'drivers',
                'orders',
                'chats',
                'reviews',
                'locations',
                'live',
                'complaints',
                'dispatch',
            ]);
        case 'ACCOUNTANT': {
            const x = { ...n };
            x.dashboard = 'read';
            x.analytics = 'read';
            x.analytics_finance = 'write';
            x.transactions = 'write';
            x.tariffs = 'write';
            x.employees = 'read';
            x.orders = 'read';
            return x;
        }
        default:
            return n;
    }
}
function buildEffectivePermissions(legacyRole, officeRolePermissions) {
    const base = defaultPermissionsForLegacyRole(legacyRole);
    return mergePermissionPatch(base, officeRolePermissions);
}
function levelMeets(have, need) {
    const rank = { none: 0, read: 1, write: 2 };
    return rank[have] >= rank[need];
}
//# sourceMappingURL=officePermissions.js.map