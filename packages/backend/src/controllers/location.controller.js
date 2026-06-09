"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const location_service_1 = require("../services/location.service");
const authorize_middleware_1 = require("../middleware/authorize.middleware");
const locationService = new location_service_1.LocationService();
class LocationController {
    async listRecent(req, res) {
        try {
            const user = req.user;
            if (!user || !(0, authorize_middleware_1.isOperationsRole)(user.role)) {
                return res.status(403).json({ error: 'Staff only' });
            }
            const limit = parseInt(String(req.query.limit ?? '2000'), 10);
            const history = await locationService.getRecentLogs(Number.isFinite(limit) ? limit : 2000);
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async create(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const driverId = req.body?.driverId ?? req.body?.driver?.connect?.id;
            if (driverId && !(0, authorize_middleware_1.isOperationsRole)(user.role)) {
                if (user.role !== 'DRIVER' || user.driverId !== driverId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }
            else if (!driverId && !(0, authorize_middleware_1.isOperationsRole)(user.role)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const log = await locationService.create(req.body);
            res.status(201).json(log);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getHistory(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { driverId, from, to } = req.query;
            const did = String(driverId);
            if (!(0, authorize_middleware_1.isOperationsRole)(user.role)) {
                if (user.role !== 'DRIVER' || user.driverId !== did) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }
            const history = await locationService.getDriverHistory(did, new Date(String(from)), new Date(String(to)));
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getHeatmap(req, res) {
        try {
            const user = req.user;
            if (!user || !(0, authorize_middleware_1.isOperationsRole)(user.role)) {
                return res.status(403).json({ error: 'Staff only' });
            }
            const { from, to, type } = req.query;
            const fromDate = from ? new Date(String(from)) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const toDate = to ? new Date(String(to)) : new Date();
            const heatmapType = type ?? 'both';
            if (!['pickup', 'dropoff', 'both'].includes(heatmapType)) {
                return res.status(400).json({ error: 'Invalid type. Use pickup, dropoff, or both' });
            }
            const data = await locationService.getHeatmapData(fromDate, toDate, heatmapType);
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.LocationController = LocationController;
//# sourceMappingURL=location.controller.js.map