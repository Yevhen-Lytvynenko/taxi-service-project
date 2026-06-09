"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const officePermissions_1 = require("../lib/officePermissions");
const prisma_1 = require("../lib/prisma");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const userForAuthInclude = {
    driverProfile: true,
    employeeProfile: true,
    officeRole: true,
};
function jwtPayload(user) {
    const legacyForPerms = (user.officeRole?.legacyRole ?? user.role);
    const permsObj = (0, authorize_middleware_1.isOfficeRole)(user.role)
        ? (0, officePermissions_1.buildEffectivePermissions)(legacyForPerms, user.officeRole?.permissions)
        : null;
    const perms = permsObj &&
        Object.fromEntries(Object.entries(permsObj));
    return {
        id: user.id,
        role: user.role,
        driverId: user.driverProfile?.id,
        officeRoleId: user.officeRoleId ?? undefined,
        ...(perms ? { perms } : {}),
    };
}
class AuthService {
    async login(phone, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { phone },
            include: userForAuthInclude,
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        const token = jsonwebtoken_1.default.sign(jwtPayload(user), (0, env_1.getJwtSecret)(), { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        return {
            token,
            user: userWithoutPassword,
        };
    }
    async loginByUsername(username, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { username },
            include: userForAuthInclude,
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        const token = jsonwebtoken_1.default.sign(jwtPayload(user), (0, env_1.getJwtSecret)(), { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        return {
            token,
            user: userWithoutPassword,
        };
    }
    async getProfile(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: userForAuthInclude,
        });
        if (!user) {
            return null;
        }
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updatePushToken(userId, pushToken) {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { pushToken: pushToken || null },
            include: userForAuthInclude,
        });
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map