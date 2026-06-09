"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const audit_service_1 = require("../services/audit.service");
const userService = new user_service_1.UserService();
class UserController {
    async create(req, res) {
        try {
            const user = await userService.create(req.body);
            const { password, ...userWithoutPassword } = user;
            res.status(201).json(userWithoutPassword);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const users = await userService.findAll();
            res.json(users);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getOne(req, res) {
        try {
            const user = await userService.findById(req.params.id);
            if (!user)
                return res.status(404).json({ error: 'User not found' });
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const actor = req.user;
            const targetId = req.params.id;
            let body = { ...req.body };
            if (actor && !(0, authorize_middleware_1.isOperationsRole)(actor.role) && actor.id === targetId) {
                const next = {};
                if (typeof body.fullName === 'string')
                    next.fullName = body.fullName.trim();
                if (body.email === null || body.email === '')
                    next.email = null;
                else if (typeof body.email === 'string')
                    next.email = body.email.trim() || null;
                if (body.avatarUrl === null || body.avatarUrl === '')
                    next.avatarUrl = null;
                else if (typeof body.avatarUrl === 'string') {
                    if (body.avatarUrl.length > 400_000) {
                        return res.status(400).json({ error: 'Зображення профілю занадто велике' });
                    }
                    next.avatarUrl = body.avatarUrl;
                }
                body = next;
            }
            else if (actor && !(0, authorize_middleware_1.isOperationsRole)(actor.role) && actor.id !== targetId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            else if (actor && (0, authorize_middleware_1.isOperationsRole)(actor.role)) {
                if (actor.role !== 'ADMIN' && 'officeRoleId' in body) {
                    delete body.officeRoleId;
                }
                if (typeof body.avatarUrl === 'string' && body.avatarUrl.length > 400_000) {
                    return res.status(400).json({ error: 'Зображення профілю занадто велике' });
                }
            }
            const user = await userService.update(targetId, body);
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            const targetId = req.params.id;
            await userService.delete(targetId);
            void (0, audit_service_1.writeAuditLog)({
                userId: req.user?.id,
                action: 'USER_DELETE',
                entity: 'User',
                entityId: targetId,
                ip: (0, audit_service_1.clientIp)(req),
            });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map