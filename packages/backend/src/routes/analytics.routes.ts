import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOfficeStaff, requireOperationsStaff } from '../middleware/authorize.middleware';
import { requireOfficePermission } from '../middleware/permissions.middleware';

const router = Router();
const c = new AnalyticsController();

router.use(authMiddleware);

router.get('/finance/opex', requireOfficePermission('analytics_finance', 'read'), c.finance.bind(c));
router.get('/finance/daily', requireOfficePermission('analytics_finance', 'read'), c.financeDaily.bind(c));
router.get('/export/orders', requireOfficePermission('analytics_finance', 'write'), c.exportOrders.bind(c));

router.use(requireOfficeStaff);

router.get('/summary', c.summary.bind(c));
router.get('/peaks', c.peaks.bind(c));
router.get('/routes/efficiency', c.routes.bind(c));
router.get('/traffic/grid', c.traffic.bind(c));

router.get('/demand/hourly', c.demandSeries.bind(c));
router.get('/demand/peaks', c.peaksDetected.bind(c));
router.get('/demand/forecast', c.forecast.bind(c));

router.get('/surge/timeseries', c.surge.bind(c));

router.get('/geo/pickup-grid', c.pickupGrid.bind(c));

router.get('/fleet/driver-kpis', c.driverKpis.bind(c));

router.post('/maintenance', requireOperationsStaff, c.createMaintenance.bind(c));
router.get('/maintenance/vehicle/:vehicleId', requireOperationsStaff, c.listMaintenance.bind(c));
router.post('/payroll', requireOfficePermission('analytics_finance', 'write'), c.createPayroll.bind(c));
router.post('/operating-expenses', requireOfficePermission('analytics_finance', 'write'), c.createOperatingExpense.bind(c));

export default router;
