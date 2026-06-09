import { Request, Response, NextFunction } from 'express';
import { type OfficePermissionKey } from '../lib/officePermissions';
/** Перевірка матриці дозволів офісу (JWT `perms` або дефолт за `role`). */
export declare function requireOfficePermission(key: OfficePermissionKey, min: 'read' | 'write'): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=permissions.middleware.d.ts.map