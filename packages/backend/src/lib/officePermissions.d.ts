import type { Role } from '@prisma/client';
export type PermLevel = 'none' | 'read' | 'write';
export declare const OFFICE_PERMISSION_KEYS: readonly ["dashboard", "users", "clients", "drivers", "employees", "orders", "transactions", "chats", "reviews", "locations", "tariffs", "live", "analytics", "analytics_finance", "complaints", "audit", "roles_manage", "dispatch"];
export type OfficePermissionKey = (typeof OFFICE_PERMISSION_KEYS)[number];
export declare function mergePermissionPatch(base: Record<OfficePermissionKey, PermLevel>, patch: unknown): Record<OfficePermissionKey, PermLevel>;
export declare function defaultPermissionsForLegacyRole(role: Role): Record<OfficePermissionKey, PermLevel>;
export declare function buildEffectivePermissions(legacyRole: Role, officeRolePermissions: unknown): Record<OfficePermissionKey, PermLevel>;
export declare function levelMeets(have: PermLevel, need: 'read' | 'write'): boolean;
//# sourceMappingURL=officePermissions.d.ts.map