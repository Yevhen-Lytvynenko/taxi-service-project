"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TariffService = void 0;
const prisma_1 = require("../lib/prisma");
class TariffService {
    async create(data) {
        return prisma_1.prisma.tariff.create({
            data
        });
    }
    async findAll() {
        return prisma_1.prisma.tariff.findMany();
    }
    async findById(id) {
        return prisma_1.prisma.tariff.findUnique({
            where: { id }
        });
    }
    async findByName(name) {
        return prisma_1.prisma.tariff.findUnique({
            where: { name }
        });
    }
    async update(id, data) {
        return prisma_1.prisma.tariff.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return prisma_1.prisma.tariff.delete({
            where: { id }
        });
    }
}
exports.TariffService = TariffService;
//# sourceMappingURL=tariff.service.js.map