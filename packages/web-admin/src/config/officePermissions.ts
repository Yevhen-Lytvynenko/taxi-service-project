type DbRole = 'CLIENT' | 'DRIVER' | 'DISPATCHER' | 'MANAGER' | 'ADMIN' | 'ACCOUNTANT';

export type PermLevel = 'none' | 'read' | 'write';

export const OFFICE_PERMISSION_KEYS = [
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
] as const;

export type OfficePermissionKey = (typeof OFFICE_PERMISSION_KEYS)[number];

function all(level: PermLevel): Record<OfficePermissionKey, PermLevel> {
  return Object.fromEntries(OFFICE_PERMISSION_KEYS.map((k) => [k, level])) as Record<
    OfficePermissionKey,
    PermLevel
  >;
}

export function mergePermissionPatch(
  base: Record<OfficePermissionKey, PermLevel>,
  patch: unknown
): Record<OfficePermissionKey, PermLevel> {
  const out = { ...base };
  if (!patch || typeof patch !== 'object') return out;
  const p = patch as Record<string, unknown>;
  for (const k of OFFICE_PERMISSION_KEYS) {
    const v = p[k];
    if (v === 'none' || v === 'read' || v === 'write') out[k] = v;
  }
  return out;
}

export function defaultPermissionsForLegacyRole(role: DbRole): Record<OfficePermissionKey, PermLevel> {
  const n = all('none');
  const w = (keys: OfficePermissionKey[]) => {
    const x = { ...n };
    for (const k of keys) x[k] = 'write';
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

export function buildEffectivePermissions(
  legacyRole: DbRole,
  officeRolePermissions: unknown
): Record<OfficePermissionKey, PermLevel> {
  const base = defaultPermissionsForLegacyRole(legacyRole);
  return mergePermissionPatch(base, officeRolePermissions);
}

export function levelMeets(have: PermLevel, need: 'read' | 'write'): boolean {
  const rank: Record<PermLevel, number> = { none: 0, read: 1, write: 2 };
  return rank[have] >= rank[need];
}
