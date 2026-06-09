"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleController = void 0;
const vehicle_service_1 = require("../services/vehicle.service");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const vehicleService = new vehicle_service_1.VehicleService();
class VehicleController {
    async create(req, res) {
        try {
            const vehicle = await vehicleService.create(req.body);
            res.status(201).json(vehicle);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const vehicles = await vehicleService.findAll();
            res.json(vehicles);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getOne(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const vehicle = await vehicleService.findById(req.params.id);
            if (!vehicle)
                return res.status(404).json({ error: 'Vehicle not found' });
            const ownerUserId = vehicle.driver?.user?.id;
            if (!(0, authorize_middleware_1.isStaffRole)(user.role) && ownerUserId !== user.id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            res.json(vehicle);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const vehicle = await vehicleService.update(req.params.id, req.body);
            res.json(vehicle);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            await vehicleService.delete(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.VehicleController = VehicleController;
//# sourceMappingURL=vehicle.controller.js.map