"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
class UserService {
    async create(data) {
        const officeRoleId = typeof data.officeRoleId === 'string'
            ? data.officeRoleId
            : undefined;
        const { officeRoleId: _omit, ...rest } = data;
        let createData = { ...rest };
        if (officeRoleId) {
            const orole = await prisma_1.prisma.officeRole.findUnique({ where: { id: officeRoleId } });
            if (!orole) {
                throw new Error('Office role not found');
            }
            createData.role = orole.legacyRole;
            createData.officeRole = { connect: { id: officeRoleId } };
        }
        const hashedPassword = await bcryptjs_1.default.hash(createData.password, 10);
        return prisma_1.prisma.user.create({
            data: {
                ...createData,
                password: hashedPassword,
            },
            include: {
                driverProfile: true,
                employeeProfile: true,
                officeRole: true,
            },
        });
    }
    async findAll() {
        return prisma_1.prisma.user.findMany({
            include: {
                driverProfile: true,
                employeeProfile: true,
                officeRole: true,
                clientOrders: true,
            },
        });
    }
    async findById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            include: {
                driverProfile: true,
                employeeProfile: true,
                officeRole: true,
                clientOrders: true,
            },
        });
    }
    async update(id, data) {
        const { officeRoleId, ...rest } = data;
        let patch = { ...rest };
        if (officeRoleId !== undefined) {
            if (officeRoleId === null || officeRoleId === '') {
                patch.officeRole = { disconnect: true };
            }
            else if (typeof officeRoleId === 'string') {
                const orole = await prisma_1.prisma.officeRole.findUnique({ where: { id: officeRoleId } });
                if (!orole) {
                    throw new Error('Office role not found');
                }
                patch.role = orole.legacyRole;
                patch.officeRole = { connect: { id: officeRoleId } };
            }
        }
        if (patch.password && typeof patch.password === 'string') {
            patch.password = await bcryptjs_1.default.hash(patch.password, 10);
        }
        return prisma_1.prisma.user.update({
            where: { id },
            data: patch,
            include: {
                driverProfile: true,
                employeeProfile: true,
                officeRole: true,
            },
        });
    }
    async delete(id) {
        return prisma_1.prisma.user.delete({
            where: { id },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map