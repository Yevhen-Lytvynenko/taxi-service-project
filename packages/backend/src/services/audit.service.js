"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientIp = clientIp;
exports.writeAuditLog = writeAuditLog;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
function clientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.length)
        return xf.split(',')[0]?.trim();
    return req.socket?.remoteAddress ?? undefined;
}
async function writeAuditLog(entry) {
    const data = {
        action: entry.action,
    };
    if (entry.userId !== undefined)
        data.userId = entry.userId;
    if (entry.entity !== undefined)
        data.entity = entry.entity;
    if (entry.entityId !== undefined)
        data.entityId = entry.entityId;
    if (entry.ip !== undefined)
        data.ip = entry.ip;
    if (entry.metadata != null) {
        data.metadata = entry.metadata;
    }
    try {
        await prisma_1.prisma.auditLog.create({ data });
    }
    catch (e) {
        if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
            logger_1.logger.warn({ table: e.meta?.table }, 'AuditLog: таблиця ще не створена в БД. Виконайте `npm run db:push -w packages/backend` (або `npx prisma migrate dev`).');
            return;
        }
        logger_1.logger.error({ err: e, action: entry.action }, 'writeAuditLog failed');
    }
}
//# sourceMappingURL=audit.service.js.map