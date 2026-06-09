"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const orderAccess_1 = require("../lib/orderAccess");
const createSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1).optional(),
    subjectText: zod_1.z.string().min(3),
});
class ComplaintController {
    async create(req, res) {
        try {
            const uid = req.user?.id;
            if (!uid || req.user?.role !== 'CLIENT') {
                return res.status(403).json({ error: 'Clients only' });
            }
            const parsed = createSchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ error: parsed.error.flatten() });
            const { orderId, subjectText } = parsed.data;
            if (orderId) {
                await (0, orderAccess_1.assertOrderAccess)(orderId, req.user);
            }
            const row = await prisma_1.prisma.complaint.create({
                data: {
                    orderId: orderId ?? null,
                    authorClientId: uid,
                    subjectText,
                },
            });
            res.status(201).json(row);
        }
        catch (e) {
            const code = e.status === 404 ? 404 : e.status === 403 ? 403 : 400;
            res.status(code).json({ error: e.message });
        }
    }
    async listStaff(req, res) {
        try {
            const from = req.query.from ? new Date(String(req.query.from)) : undefined;
            const to = req.query.to ? new Date(String(req.query.to)) : undefined;
            const status = req.query.status;
            const rows = await prisma_1.prisma.complaint.findMany({
                where: {
                    ...(status ? { status } : {}),
                    ...(from || to
                        ? {
                            createdAt: {
                                ...(from ? { gte: from } : {}),
                                ...(to ? { lte: to } : {}),
                            },
                        }
                        : {}),
                },
                orderBy: { createdAt: 'desc' },
                take: 500,
                include: {
                    author: { select: { id: true, fullName: true, phone: true } },
                    order: { select: { id: true, status: true, pickupAddress: true, dropoffAddress: true } },
                },
            });
            res.json(rows);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async updateStatus(req, res) {
        try {
            const id = req.params.id;
            const status = req.body?.status;
            if (!status || !Object.values(client_1.ComplaintStatus).includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            const row = await prisma_1.prisma.complaint.update({
                where: { id },
                data: { status },
            });
            res.json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
}
exports.ComplaintController = ComplaintController;
//# sourceMappingURL=complaint.controller.js.map