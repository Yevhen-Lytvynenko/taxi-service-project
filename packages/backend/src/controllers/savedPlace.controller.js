"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedPlaceController = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const bodySchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
});
class SavedPlaceController {
    async listMine(req, res) {
        try {
            const uid = req.user?.id;
            if (!uid)
                return res.status(401).json({ error: 'Unauthorized' });
            const rows = await prisma_1.prisma.savedPlace.findMany({
                where: { userId: uid },
                orderBy: { createdAt: 'desc' },
            });
            res.json(rows);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async createMine(req, res) {
        try {
            const uid = req.user?.id;
            if (!uid)
                return res.status(401).json({ error: 'Unauthorized' });
            const parsed = bodySchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ error: parsed.error.flatten() });
            const row = await prisma_1.prisma.savedPlace.create({
                data: { userId: uid, ...parsed.data },
            });
            res.status(201).json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async updateMine(req, res) {
        try {
            const uid = req.user?.id;
            if (!uid)
                return res.status(401).json({ error: 'Unauthorized' });
            const id = req.params.id;
            const parsed = bodySchema.partial().safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ error: parsed.error.flatten() });
            const existing = await prisma_1.prisma.savedPlace.findFirst({ where: { id, userId: uid } });
            if (!existing)
                return res.status(404).json({ error: 'Not found' });
            const p = parsed.data;
            const data = {};
            if (p.label !== undefined)
                data.label = p.label;
            if (p.address !== undefined)
                data.address = p.address;
            if (p.lat !== undefined)
                data.lat = p.lat;
            if (p.lng !== undefined)
                data.lng = p.lng;
            const row = await prisma_1.prisma.savedPlace.update({
                where: { id },
                data,
            });
            res.json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async deleteMine(req, res) {
        try {
            const uid = req.user?.id;
            if (!uid)
                return res.status(401).json({ error: 'Unauthorized' });
            const id = req.params.id;
            const existing = await prisma_1.prisma.savedPlace.findFirst({ where: { id, userId: uid } });
            if (!existing)
                return res.status(404).json({ error: 'Not found' });
            await prisma_1.prisma.savedPlace.delete({ where: { id } });
            res.status(204).send();
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.SavedPlaceController = SavedPlaceController;
//# sourceMappingURL=savedPlace.controller.js.map