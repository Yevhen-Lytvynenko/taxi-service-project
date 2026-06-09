"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleService = void 0;
const prisma_1 = require("../lib/prisma");
class VehicleService {
    async create(data) {
        return prisma_1.prisma.vehicle.create({
            data,
            include: {
                driver: true
            }
        });
    }
    async findAll() {
        return prisma_1.prisma.vehicle.findMany({
            include: {
                driver: {
                    include: { user: true }
                }
            }
        });
    }
    async findById(id) {
        return prisma_1.prisma.vehicle.findUnique({
            where: { id },
            include: {
                driver: { include: { user: true } },
            },
        });
    }
    async update(id, data) {
        return prisma_1.prisma.vehicle.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return prisma_1.prisma.vehicle.delete({
            where: { id }
        });
    }
}
exports.VehicleService = VehicleService;
//# sourceMappingURL=vehicle.service.js.map