"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodeController = void 0;
const geocode_service_1 = require("../services/geocode.service");
class GeocodeController {
    async geocode(req, res) {
        try {
            const address = req.query.address;
            if (!address) {
                return res.status(400).json({ error: 'address query param is required' });
            }
            const result = await (0, geocode_service_1.geocodeAddress)(address);
            if (!result) {
                return res.status(404).json({ error: 'Address not found' });
            }
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async reverseGeocode(req, res) {
        try {
            const lat = parseFloat(req.query.lat);
            const lng = parseFloat(req.query.lng);
            if (isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({ error: 'lat and lng query params are required and must be numbers' });
            }
            const result = await (0, geocode_service_1.reverseGeocode)(lat, lng);
            if (!result) {
                return res.status(404).json({ error: 'Address not found for coordinates' });
            }
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.GeocodeController = GeocodeController;
//# sourceMappingURL=geocode.controller.js.map