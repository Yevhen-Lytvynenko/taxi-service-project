"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const prisma_1 = require("../lib/prisma");
class DriverService {
    async create(data) {
        return prisma_1.prisma.driverProfile.create({
            data,
            include: {
                user: true,
                vehicle: true
            }
        });
    }
    async findAll(withLocation = false) {
        const where = withLocation
            ? { currentLat: { not: null }, currentLng: { not: null } }
            : {};
        return prisma_1.prisma.driverProfile.findMany({
            where,
            include: {
                user: true,
                vehicle: true,
                driverOrders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    async findById(id) {
        return prisma_1.prisma.driverProfile.findUnique({
            where: { id },
            include: {
                user: true,
                vehicle: true,
                driverOrders: true,
                transactions: true,
                reviews: true,
                locationLogs: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                }
            }
        });
    }
    async findByUserId(userId) {
        return prisma_1.prisma.driverProfile.findUnique({
            where: { userId },
            include: {
                user: true,
                vehicle: true
            }
        });
    }
    async update(id, data) {
        return prisma_1.prisma.driverProfile.update({
            where: { id },
            data,
            include: {
                vehicle: true
            }
        });
    }
    async delete(id) {
        return prisma_1.prisma.driverProfile.delete({
            where: { id }
        });
    }
}
exports.DriverService = DriverService;
//# sourceMappingURL=driver.service.js.map