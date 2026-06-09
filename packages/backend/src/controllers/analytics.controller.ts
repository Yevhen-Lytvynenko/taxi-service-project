import { Request, Response } from 'express';
import { Prisma, PayrollAccrualType } from '@prisma/client';
import {
  getSummary,
  getPeaks,
  getRouteEfficiency,
  getTrafficHexGrid,
  getFinanceOpex,
  getDemandHourlySeries,
  getPeakHoursDetected,
  getDemandForecast,
  getSurgeTimeSeries,
  getPickupDemandGrid,
  getDriverKpis,
  getFinancialDailySeries,
  getOrdersExportRows,
} from '../services/analytics.service';

import { prisma } from '../lib/prisma';

export class AnalyticsController {
  async summary(req: Request, res: Response) {
    try {
      const data = await getSummary(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async peaks(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 12;
      const data = await getPeaks(req.query.from as string, req.query.to as string, limit);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async routes(req: Request, res: Response) {
    try {
      const data = await getRouteEfficiency(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async traffic(req: Request, res: Response) {
    try {
      const cell = req.query.cell ? Number(req.query.cell) : 0.01;
      const data = await getTrafficHexGrid(
        req.query.from as string,
        req.query.to as string,
        cell
      );
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async finance(req: Request, res: Response) {
    try {
      const data = await getFinanceOpex(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async demandSeries(req: Request, res: Response) {
    try {
      const data = await getDemandHourlySeries(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async peaksDetected(req: Request, res: Response) {
    try {
      const data = await getPeakHoursDetected(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async forecast(req: Request, res: Response) {
    try {
      const data = await getDemandForecast(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async surge(req: Request, res: Response) {
    try {
      const data = await getSurgeTimeSeries(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async pickupGrid(req: Request, res: Response) {
    try {
      const cell = req.query.cell ? Number(req.query.cell) : 0.012;
      const data = await getPickupDemandGrid(req.query.from as string, req.query.to as string, cell);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async driverKpis(req: Request, res: Response) {
    try {
      const data = await getDriverKpis(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async financeDaily(req: Request, res: Response) {
    try {
      const data = await getFinancialDailySeries(req.query.from as string, req.query.to as string);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async exportOrders(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5000;
      const data = await getOrdersExportRows(req.query.from as string, req.query.to as string, limit);
      res.json({ rows: data });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async createMaintenance(req: Request, res: Response) {
    try {
      const { vehicleId, serviceType, amount, odometerKm, vendor, notes, serviceDate } = req.body;
      if (!vehicleId || !serviceType || amount == null) {
        return res.status(400).json({ error: 'vehicleId, serviceType, and amount are required' });
      }
      const record = await prisma.vehicleMaintenanceRecord.create({
        data: {
          vehicleId: String(vehicleId),
          serviceType: String(serviceType),
          amount: new Prisma.Decimal(String(amount)),
          odometerKm: odometerKm != null ? Number(odometerKm) : null,
          vendor: vendor != null ? String(vendor) : null,
          notes: notes != null ? String(notes) : null,
          serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        },
      });
      res.status(201).json(record);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async listMaintenance(req: Request, res: Response) {
    try {
      const vehicleId = req.params.vehicleId as string;
      const rows = await prisma.vehicleMaintenanceRecord.findMany({
        where: { vehicleId },
        orderBy: { serviceDate: 'desc' },
      });
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async createPayroll(req: Request, res: Response) {
    try {
      const { userId, periodStart, periodEnd, amount, type, description } = req.body;
      if (!userId || !periodStart || !periodEnd || amount == null || !type) {
        return res
          .status(400)
          .json({ error: 'userId, periodStart, periodEnd, amount, and type are required' });
      }
      if (!Object.values(PayrollAccrualType).includes(type)) {
        return res.status(400).json({ error: 'Invalid payroll type' });
      }
      const row = await prisma.payrollAccrual.create({
        data: {
          userId: String(userId),
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          amount: new Prisma.Decimal(String(amount)),
          type: type as PayrollAccrualType,
          description: description != null ? String(description) : null,
        },
      });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async createOperatingExpense(req: Request, res: Response) {
    try {
      const { category, amount, description, expenseDate } = req.body;
      if (!category || amount == null) {
        return res.status(400).json({ error: 'category and amount are required' });
      }
      const row = await prisma.operatingExpense.create({
        data: {
          category: String(category),
          amount: new Prisma.Decimal(String(amount)),
          description: description != null ? String(description) : null,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        },
      });
      res.status(201).json(row);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
