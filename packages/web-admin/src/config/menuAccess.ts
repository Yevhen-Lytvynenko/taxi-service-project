import {
  type OfficePermissionKey,
  type PermLevel,
  defaultPermissionsForLegacyRole,
  levelMeets,
} from './officePermissions';

type DbRole = 'CLIENT' | 'DRIVER' | 'DISPATCHER' | 'MANAGER' | 'ADMIN' | 'ACCOUNTANT';

/** Ролі співробітників у web-admin (узгоджено з Prisma Role для staff). */
export type StaffRole = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'DISPATCHER';

export const ALL_STAFF_ROLES: StaffRole[] = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'DISPATCHER'];

export function parseStaffRole(raw: string | undefined | null): StaffRole | null {
  if (!raw) return null;
  const r = String(raw).trim().toUpperCase();
  if (r === 'ADMIN' || r === 'MANAGER' || r === 'ACCOUNTANT' || r === 'DISPATCHER') return r;
  return null;
}

export function getStoredStaffRole(): StaffRole | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw) as { role?: string; officeRole?: { legacyRole?: string } };
    return parseStaffRole(u.role) ?? parseStaffRole(u.officeRole?.legacyRole);
  } catch {
    return null;
  }
}

export function getStoredPermissions(): Partial<Record<OfficePermissionKey, PermLevel>> | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw) as { perms?: Record<string, string> };
    if (!u.perms || typeof u.perms !== 'object') return null;
    return u.perms as Partial<Record<OfficePermissionKey, PermLevel>>;
  } catch {
    return null;
  }
}

export function getLegacyRoleForPermissions(): DbRole | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw) as { role?: string; officeRole?: { legacyRole?: string } };
    const fromOffice = u.officeRole?.legacyRole;
    if (
      fromOffice === 'ADMIN' ||
      fromOffice === 'MANAGER' ||
      fromOffice === 'DISPATCHER' ||
      fromOffice === 'ACCOUNTANT'
    ) {
      return fromOffice as DbRole;
    }
    return parseStaffRole(u.role) as DbRole | null;
  } catch {
    return null;
  }
}

function effectiveLevel(role: StaffRole, key: OfficePermissionKey): PermLevel {
  /** Системний ADMIN завжди з повним доступом (навіть якщо в БД зіпсовано permissions ролі). */
  if (role === 'ADMIN') {
    return 'write';
  }
  const fromJwt = getStoredPermissions()?.[key];
  if (fromJwt === 'none' || fromJwt === 'read' || fromJwt === 'write') {
    return fromJwt;
  }
  return defaultPermissionsForLegacyRole(role as DbRole)[key];
}

export function permAllows(role: StaffRole, key: OfficePermissionKey, min: 'read' | 'write'): boolean {
  return levelMeets(effectiveLevel(role, key), min);
}

function normalizePath(path: string): string {
  return (path.split('?')[0] || '').replace(/\/+$/, '') || '/';
}

/** Маршрут → ключ дозволу. */
export function pathToPermRule(
  path: string
): { key: OfficePermissionKey; min: 'read' | 'write' } | null {
  const p = normalizePath(path);
  if (p === '/dashboard') return { key: 'dashboard', min: 'read' };
  if (p === '/users' || p.startsWith('/users/')) return { key: 'users', min: 'read' };
  if (p === '/clients' || p.startsWith('/clients/')) return { key: 'clients', min: 'read' };
  if (p === '/drivers' || p.startsWith('/drivers/')) return { key: 'drivers', min: 'read' };
  if (p === '/employees' || p.startsWith('/employees/')) return { key: 'employees', min: 'read' };
  if (p === '/orders' || p.startsWith('/orders/')) return { key: 'orders', min: 'read' };
  if (p === '/transactions' || p.startsWith('/transactions/')) return { key: 'transactions', min: 'read' };
  if (p === '/chats' || p.startsWith('/chats/')) return { key: 'chats', min: 'read' };
  if (p === '/reviews' || p.startsWith('/reviews/')) return { key: 'reviews', min: 'read' };
  if (p === '/locations' || p.startsWith('/locations/')) return { key: 'locations', min: 'read' };
  if (p === '/tariffs' || p.startsWith('/tariffs/')) return { key: 'tariffs', min: 'read' };
  if (p === '/live' || p.startsWith('/live/')) return { key: 'live', min: 'read' };
  if (p.startsWith('/analytics/finance')) return { key: 'analytics_finance', min: 'read' };
  if (p.startsWith('/analytics')) return { key: 'analytics', min: 'read' };
  if (p === '/complaints' || p.startsWith('/complaints/')) return { key: 'complaints', min: 'read' };
  if (p === '/audit-logs' || p.startsWith('/audit-logs/')) return { key: 'audit', min: 'read' };
  if (p === '/settings/roles' || p.startsWith('/settings/roles/')) return { key: 'roles_manage', min: 'read' };
  return null;
}

export function postLoginDefaultPath(role: string | undefined): string {
  const staff = parseStaffRole(role);
  if (staff) return firstAccessiblePath(staff);
  if (role === 'ACCOUNTANT') return '/analytics/finance';
  return '/dashboard';
}

const ROUTE_PRIORITY: string[] = [
  '/dashboard',
  '/orders',
  '/drivers',
  '/clients',
  '/users',
  '/employees',
  '/transactions',
  '/chats',
  '/reviews',
  '/locations',
  '/tariffs',
  '/live',
  '/complaints',
  '/audit-logs',
  '/analytics/finance',
  '/analytics/demand',
  '/analytics',
  '/settings/profile',
];

/** Перший маршрут, доступний ролі (якщо поточна сторінка заборонена). */
export function firstAccessiblePath(role: StaffRole): string {
  for (const p of ROUTE_PRIORITY) {
    if (roleCanAccessPath(role, p)) return p;
  }
  return '/settings/profile';
}

/** Перевірка доступу до шляху після входу в адмін-панель. */
export function roleCanAccessPath(role: StaffRole | null, path: string): boolean {
  if (!role) return false;
  const p = normalizePath(path);
  if (p.startsWith('/settings/profile')) return true;
  if (p.startsWith('/settings/release-notes')) return true;
  const rule = pathToPermRule(p);
  if (!rule) return true;
  return permAllows(role, rule.key, rule.min);
}

export type MenuRowConfig =
  | { type: 'divider' }
  | { type: 'subheader'; text: string }
  | { type: 'link'; text: string; path: string };

export function filterMenuByPathAccess(menu: MenuRowConfig[], role: StaffRole | null): MenuRowConfig[] {
  if (!role) return [];
  const passes = (item: MenuRowConfig) => {
    if (item.type === 'divider' || item.type === 'subheader') return true;
    return roleCanAccessPath(role, item.path);
  };

  const raw = menu.filter(passes);
  const out: MenuRowConfig[] = [];
  let pendingSubheader: MenuRowConfig | null = null;

  for (const item of raw) {
    if (item.type === 'subheader') {
      pendingSubheader = item;
      continue;
    }
    if (item.type === 'divider') {
      pendingSubheader = null;
      out.push(item);
      continue;
    }
    if (pendingSubheader) {
      out.push(pendingSubheader);
      pendingSubheader = null;
    }
    out.push(item);
  }
  return out;
}
