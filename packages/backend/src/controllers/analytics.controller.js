"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const client_1 = require("@prisma/client");
const analytics_service_1 = require("../services/analytics.service");
const prisma_1 = require("../lib/prisma");
class AnalyticsController {
    async summary(req, res) {
        try {
            const data = await (0, analytics_service_1.getSummary)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async peaks(req, res) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 12;
            const data = await (0, analytics_service_1.getPeaks)(req.query.from, req.query.to, limit);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async routes(req, res) {
        try {
            const data = await (0, analytics_service_1.getRouteEfficiency)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async traffic(req, res) {
        try {
            const cell = req.query.cell ? Number(req.query.cell) : 0.01;
            const data = await (0, analytics_service_1.getTrafficHexGrid)(req.query.from, req.query.to, cell);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async finance(req, res) {
        try {
            const data = await (0, analytics_service_1.getFinanceOpex)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async demandSeries(req, res) {
        try {
            const data = await (0, analytics_service_1.getDemandHourlySeries)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async peaksDetected(req, res) {
        try {
            const data = await (0, analytics_service_1.getPeakHoursDetected)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async forecast(req, res) {
        try {
            const data = await (0, analytics_service_1.getDemandForecast)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async surge(req, res) {
        try {
            const data = await (0, analytics_service_1.getSurgeTimeSeries)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async pickupGrid(req, res) {
        try {
            const cell = req.query.cell ? Number(req.query.cell) : 0.012;
            const data = await (0, analytics_service_1.getPickupDemandGrid)(req.query.from, req.query.to, cell);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async driverKpis(req, res) {
        try {
            const data = await (0, analytics_service_1.getDriverKpis)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async financeDaily(req, res) {
        try {
            const data = await (0, analytics_service_1.getFinancialDailySeries)(req.query.from, req.query.to);
            res.json(data);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async exportOrders(req, res) {
        try {
            const limit = req.query.limit ? Number(req.query.limit) : 5000;
            const data = await (0, analytics_service_1.getOrdersExportRows)(req.query.from, req.query.to, limit);
            res.json({ rows: data });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async createMaintenance(req, res) {
        try {
            const { vehicleId, serviceType, amount, odometerKm, vendor, notes, serviceDate } = req.body;
            if (!vehicleId || !serviceType || amount == null) {
                return res.status(400).json({ error: 'vehicleId, serviceType, and amount are required' });
            }
            const record = await prisma_1.prisma.vehicleMaintenanceRecord.create({
                data: {
                    vehicleId: String(vehicleId),
                    serviceType: String(serviceType),
                    amount: new client_1.Prisma.Decimal(String(amount)),
                    odometerKm: odometerKm != null ? Number(odometerKm) : null,
                    vendor: vendor != null ? String(vendor) : null,
                    notes: notes != null ? String(notes) : null,
                    serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
                },
            });
            res.status(201).json(record);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async listMaintenance(req, res) {
        try {
            const vehicleId = req.params.vehicleId;
            const rows = await prisma_1.prisma.vehicleMaintenanceRecord.findMany({
                where: { vehicleId },
                orderBy: { serviceDate: 'desc' },
            });
            res.json(rows);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    async createPayroll(req, res) {
        try {
            const { userId, periodStart, periodEnd, amount, type, description } = req.body;
            if (!userId || !periodStart || !periodEnd || amount == null || !type) {
                return res
                    .status(400)
                    .json({ error: 'userId, periodStart, periodEnd, amount, and type are required' });
            }
            if (!Object.values(client_1.PayrollAccrualType).includes(type)) {
                return res.status(400).json({ error: 'Invalid payroll type' });
            }
            const row = await prisma_1.prisma.payrollAccrual.create({
                data: {
                    userId: String(userId),
                    periodStart: new Date(periodStart),
                    periodEnd: new Date(periodEnd),
                    amount: new client_1.Prisma.Decimal(String(amount)),
                    type: type,
                    description: description != null ? String(description) : null,
                },
            });
            res.status(201).json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
    async createOperatingExpense(req, res) {
        try {
            const { category, amount, description, expenseDate } = req.body;
            if (!category || amount == null) {
                return res.status(400).json({ error: 'category and amount are required' });
            }
            const row = await prisma_1.prisma.operatingExpense.create({
                data: {
                    category: String(category),
                    amount: new client_1.Prisma.Decimal(String(amount)),
                    description: description != null ? String(description) : null,
                    expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
                },
            });
            res.status(201).json(row);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analytics.controller.js.map