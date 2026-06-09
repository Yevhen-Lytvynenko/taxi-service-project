"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const prisma_1 = require("../lib/prisma");
class AuditLogController {
    async list(req, res) {
        try {
            const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400000);
            const to = req.query.to ? new Date(String(req.query.to)) : new Date();
            const limit = Math.min(Number(req.query.limit) || 200, 1000);
            const rows = await prisma_1.prisma.auditLog.findMany({
                where: {
                    createdAt: { gte: from, lte: to },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    user: { select: { id: true, fullName: true, username: true, role: true } },
                },
            });
            res.json(rows);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.AuditLogController = AuditLogController;
//# sourceMappingURL=auditLog.controller.js.map