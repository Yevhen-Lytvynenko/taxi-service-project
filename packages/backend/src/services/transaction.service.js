"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const prisma_1 = require("../lib/prisma");
class TransactionService {
    async create(data) {
        return prisma_1.prisma.transaction.create({
            data,
            include: {
                driver: true,
                order: true
            }
        });
    }
    async findAll() {
        return prisma_1.prisma.transaction.findMany({
            include: {
                driver: { include: { user: true } },
                order: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByDriverId(driverId) {
        return prisma_1.prisma.transaction.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findById(id) {
        return prisma_1.prisma.transaction.findUnique({
            where: { id },
            include: {
                driver: true,
                order: true
            }
        });
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transaction.service.js.map