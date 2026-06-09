"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeRoleController = void 0;
const prisma_1 = require("../lib/prisma");
const STAFF_LEGACY = ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'];
function slugifyBase(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-')
        .replace(/^-|-$/g, '');
}
class OfficeRoleController {
    async list(_req, res) {
        try {
            const rows = await prisma_1.prisma.officeRole.findMany({ orderBy: { displayName: 'asc' } });
            res.json(rows);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async create(req, res) {
        try {
            const { displayName, legacyRole, permissions, slug: slugRaw } = req.body;
            if (typeof displayName !== 'string' || !displayName.trim()) {
                return res.status(400).json({ error: 'displayName is required' });
            }
            if (typeof legacyRole !== 'string' || !STAFF_LEGACY.includes(legacyRole)) {
                return res.status(400).json({ error: 'legacyRole must be a staff Role' });
            }
            let slug = typeof slugRaw === 'string' && slugRaw.trim() ? slugRaw.trim() : slugifyBase(displayName);
            if (!slug)
                slug = `role-${Date.now().toString(36)}`;
            let trySlug = slug;
            for (let i = 0; i < 20; i++) {
                const clash = await prisma_1.prisma.officeRole.findUnique({ where: { slug: trySlug } });
                if (!clash)
                    break;
                trySlug = `${slug}-${Date.now().toString(36)}`;
            }
            const row = await prisma_1.prisma.officeRole.create({
                data: {
                    slug: trySlug,
                    displayName: displayName.trim(),
                    legacyRole: legacyRole,
                    isSystem: false,
                    permissions: permissions && typeof permissions === 'object' ? permissions : {},
                },
            });
            res.status(201).json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async patch(req, res) {
        try {
            const id = req.params.id;
            const existing = await prisma_1.prisma.officeRole.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Not found' });
            }
            const { displayName, permissions } = req.body;
            const data = {};
            if (typeof displayName === 'string' && displayName.trim()) {
                data.displayName = displayName.trim();
            }
            if (permissions && typeof permissions === 'object') {
                data.permissions = permissions;
            }
            const row = await prisma_1.prisma.officeRole.update({ where: { id }, data });
            res.json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async remove(req, res) {
        try {
            const id = req.params.id;
            const existing = await prisma_1.prisma.officeRole.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Not found' });
            }
            if (existing.isSystem) {
                return res.status(400).json({ error: 'Cannot delete system role' });
            }
            const cnt = await prisma_1.prisma.user.count({ where: { officeRoleId: id } });
            if (cnt > 0) {
                return res.status(400).json({ error: 'Role is assigned to users' });
            }
            await prisma_1.prisma.officeRole.delete({ where: { id } });
            res.status(204).send();
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
}
exports.OfficeRoleController = OfficeRoleController;
//# sourceMappingURL=officeRole.controller.js.map