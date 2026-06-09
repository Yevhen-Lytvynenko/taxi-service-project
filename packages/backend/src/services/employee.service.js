"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const prisma_1 = require("../lib/prisma");
class EmployeeService {
    async create(data) {
        return prisma_1.prisma.employeeProfile.create({
            data,
            include: { user: true }
        });
    }
    async findAll() {
        return prisma_1.prisma.employeeProfile.findMany({
            include: { user: true }
        });
    }
    async update(id, data) {
        return prisma_1.prisma.employeeProfile.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return prisma_1.prisma.employeeProfile.delete({
            where: { id }
        });
    }
}
exports.EmployeeService = EmployeeService;
//# sourceMappingURL=employee.service.js.map