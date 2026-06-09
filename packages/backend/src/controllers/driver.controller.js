"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverController = void 0;
const driver_service_1 = require("../services/driver.service");
const driverService = new driver_service_1.DriverService();
class DriverController {
    async create(req, res) {
        try {
            const driver = await driverService.create(req.body);
            res.status(201).json(driver);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const withLocation = req.query.withLocation === '1' || req.query.withLocation === 'true';
            const drivers = await driverService.findAll(withLocation);
            res.json(drivers);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getOne(req, res) {
        try {
            const driver = await driverService.findById(req.params.id);
            if (!driver)
                return res.status(404).json({ error: 'Driver profile not found' });
            res.json(driver);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const driver = await driverService.update(req.params.id, req.body);
            res.json(driver);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            await driverService.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.DriverController = DriverController;
//# sourceMappingURL=driver.controller.js.map