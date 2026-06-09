"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TariffController = void 0;
const tariff_service_1 = require("../services/tariff.service");
const audit_service_1 = require("../services/audit.service");
const tariffService = new tariff_service_1.TariffService();
class TariffController {
    async create(req, res) {
        try {
            const tariff = await tariffService.create(req.body);
            void (0, audit_service_1.writeAuditLog)({
                userId: req.user?.id,
                action: 'TARIFF_CREATE',
                entity: 'Tariff',
                entityId: tariff.id,
                metadata: { name: tariff.name },
                ip: (0, audit_service_1.clientIp)(req),
            });
            res.status(201).json(tariff);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const tariffs = await tariffService.findAll();
            res.json(tariffs);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getOne(req, res) {
        try {
            const tariff = await tariffService.findById(req.params.id);
            if (!tariff)
                return res.status(404).json({ error: 'Tariff not found' });
            res.json(tariff);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const tariff = await tariffService.update(id, req.body);
            void (0, audit_service_1.writeAuditLog)({
                userId: req.user?.id,
                action: 'TARIFF_UPDATE',
                entity: 'Tariff',
                entityId: id,
                ip: (0, audit_service_1.clientIp)(req),
            });
            res.json(tariff);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            const id = req.params.id;
            await tariffService.delete(id);
            void (0, audit_service_1.writeAuditLog)({
                userId: req.user?.id,
                action: 'TARIFF_DELETE',
                entity: 'Tariff',
                entityId: id,
                ip: (0, audit_service_1.clientIp)(req),
            });
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.TariffController = TariffController;
//# sourceMappingURL=tariff.controller.js.map