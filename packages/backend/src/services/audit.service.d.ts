import type { Request } from 'express';
/** Дозволяє `undefined` від `req.user?.id`, `clientIp(req)` тощо при exactOptionalPropertyTypes. */
export type AuditLogWriteInput = {
    userId?: string | null | undefined;
    action: string;
    entity?: string | null | undefined;
    entityId?: string | null | undefined;
    metadata?: Record<string, unknown> | null | undefined;
    ip?: string | null | undefined;
};
export declare function clientIp(req: Request): string | undefined;
export declare function writeAuditLog(entry: AuditLogWriteInput): Promise<void>;
//# sourceMappingURL=audit.service.d.ts.map