/** Payload inside JWT after login (role aligns with Prisma `Role`). */
export type JwtPermLevel = 'none' | 'read' | 'write';

export interface JwtUserPayload {
  id: string;
  role: string;
  driverId?: string;
  officeRoleId?: string;
  /** Ефективна матриця дозволів офісу (плоский об’єкт). */
  perms?: Record<string, JwtPermLevel>;
}
