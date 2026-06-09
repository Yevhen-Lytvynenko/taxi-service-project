"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteController = void 0;
const route_service_1 = require("../services/route.service");
const googleDirections_service_1 = require("../services/googleDirections.service");
function parseCoordsQuery(s) {
    const parts = s.split(',');
    if (parts.length !== 2)
        return null;
    const p0 = parts[0];
    const p1 = parts[1];
    if (p0 == null || p1 == null)
        return null;
    const lat = parseFloat(p0.trim());
    const lng = parseFloat(p1.trim());
    if (isNaN(lat) || isNaN(lng))
        return null;
    return { lat, lng };
}
class RouteController {
    async alternatives(req, res) {
        try {
            const fromStr = req.query.from;
            const toStr = req.query.to;
            if (!fromStr || !toStr) {
                return res.status(400).json({ error: 'from and to query params required (format: lat,lng)' });
            }
            const from = parseCoordsQuery(fromStr);
            const to = parseCoordsQuery(toStr);
            if (!from || !to) {
                return res
                    .status(400)
                    .json({ error: 'Invalid format. Use from=lat,lng&to=lat,lng' });
            }
            const result = await (0, googleDirections_service_1.getDrivingRouteAlternatives)(from, to);
            if (result.options.length === 0) {
                return res.status(404).json({ error: 'Route not found' });
            }
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async route(req, res) {
        try {
            const fromStr = req.query.from;
            const toStr = req.query.to;
            if (!fromStr || !toStr) {
                return res.status(400).json({ error: 'from and to query params required (format: lat,lng)' });
            }
            const from = parseCoordsQuery(fromStr);
            const to = parseCoordsQuery(toStr);
            if (!from || !to) {
                return res
                    .status(400)
                    .json({ error: 'Invalid format. Use from=lat,lng&to=lat,lng' });
            }
            const result = await (0, route_service_1.getRoute)(from, to);
            if (!result) {
                return res.status(404).json({ error: 'Route not found' });
            }
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.RouteController = RouteController;
//# sourceMappingURL=route.controller.js.map