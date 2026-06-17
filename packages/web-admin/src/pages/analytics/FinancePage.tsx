import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../api/axios';
import { getStoredStaffRole, permAllows } from '../../config/menuAccess';
import type { AnalyticsRange, DriverKpiRow } from './analyticsTypes';
import { exportDocxTable, exportPdfTable, exportXlsx } from './exportReports';
import { AnalyticsHint } from './AnalyticsHint';

type Daily = {
  dayUtc: string;
  trips: number;
  gmv: string;
  platformFees: string;
  driverEarnings: string;
};

type Summary = {
  gmv: string;
  platformFees: string;
  ordersCompleted: number;
  ordersTotal: number;
};

type Opex = Record<string, { total?: string; records?: number; transactions?: number }>;

const OPEX_LABELS: Record<string, string> = {
  fleetMaintenance: 'Обслуговування автопарку',
  payrollAccruals: 'Нарахування зарплат',
  operatingExpenses: 'Операційні витрати',
  driverPayoutsOrders: 'Виплати водіям (замовлення)',
};

export const FinancePage = () => {
  const { fromIso, toIso, fromDate, toDate, refreshKey } = useOutletContext<AnalyticsRange>();
  const [daily, setDaily] = useState<Daily[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [opex, setOpex] = useState<Opex | null>(null);
  const [drivers, setDrivers] = useState<DriverKpiRow[]>([]);
  const [exportRows, setExportRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const staffRole = getStoredStaffRole();
  const canExportOrders =
    staffRole != null && permAllows(staffRole, 'analytics_finance', 'write');

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = { from: fromIso, to: toIso };
        const [d, s, o, drv] = await Promise.all([
          api.get<Daily[]>('/analytics/finance/daily', { params: q }),
          api.get<Summary>('/analytics/summary', { params: q }),
          api.get<Opex>('/analytics/finance/opex', { params: q }),
          api.get<DriverKpiRow[]>('/analytics/fleet/driver-kpis', { params: q }),
        ]);
        let exRows: Record<string, unknown>[] = [];
        if (canExportOrders) {
          const ex = await api.get<{ rows: Record<string, unknown>[] }>('/analytics/export/orders', {
            params: { ...q, limit: 8000 },
          });
          exRows = ex.data.rows;
        }
        if (!c) {
          setDaily(d.data);
          setSummary(s.data);
          setOpex(o.data);
          setDrivers(drv.data);
          setExportRows(exRows);
        }
      } catch (e: unknown) {
        if (!c) {
          const ax = e as { response?: { data?: { error?: string } } };
          setError(ax.response?.data?.error ?? 'Помилка');
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [fromIso, toIso, refreshKey, canExportOrders]);

  const chart = daily.map((r) => ({
    day: r.dayUtc,
    dayLabel: new Date(r.dayUtc + 'T12:00:00.000Z').toLocaleDateString('uk-UA', {
      month: 'short',
      day: 'numeric',
    }),
    gmv: Number(r.gmv),
    fees: Number(r.platformFees || 0),
    drivers: Number(r.driverEarnings || 0),
    trips: r.trips,
  }));

  const handleExport = (kind: 'xlsx' | 'pdf' | 'docx') => {
    const stamp = `analytics_${fromIso.slice(0, 10)}_${toIso.slice(0, 10)}`;
    if (kind === 'xlsx') exportXlsx(exportRows, stamp);
    if (kind === 'pdf') exportPdfTable('Звіти замовлень', exportRows, stamp);
    if (kind === 'docx') void exportDocxTable('Звіти замовлень', exportRows, stamp);
  };

  if (loading && !daily.length) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Фінансова аналітика та звітність
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Період звітів: {fromDate} — {toDate}
      </Typography>
      <AnalyticsHint>
        <Typography variant="body2" color="text.secondary">
          Денні ряди завершених поїздок (GMV, комісія, виплати водіям), зведення OPEX з модулів обліку та експорт вибірки замовлень
          (за наявності прав бухгалтера/адміністратора).
        </Typography>
      </AnalyticsHint>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <Typography variant="subtitle2">Експорт замовлень:</Typography>
        {canExportOrders ? (
          <>
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={() => handleExport('xlsx')}>XLSX</Button>
              <Button onClick={() => handleExport('pdf')}>PDF</Button>
              <Button onClick={() => handleExport('docx')}>DOCX</Button>
            </ButtonGroup>
            <Typography variant="caption" color="text.secondary">
              ({exportRows.length} рядків)
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Лише перегляд. Експорт і зміни фінансових даних — для бухгалтера або адміністратора.
          </Typography>
        )}
      </Box>

      <Paper sx={{ p: 0, mb: 2, borderRadius: 2 }} variant="outlined">
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Зведення по водіях за період
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Виконані рейси, виручка (GMV), виплати водію з рейсів, комісія платформи, скасування призначені на
            водія (оцінка втраченого GMV).
          </Typography>
        </Box>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Водій</TableCell>
              <TableCell align="right">Виконано</TableCell>
              <TableCell align="right">Виручка (GMV)</TableCell>
              <TableCell align="right">Зарплата (виплати)</TableCell>
              <TableCell align="right">Комісія</TableCell>
              <TableCell align="right">Втрати (скас., ₴)</TableCell>
              <TableCell align="right">Скас.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((r) => (
              <TableRow key={r.driverId} hover>
                <TableCell>{r.fullName}</TableCell>
                <TableCell align="right">{r.completedTrips}</TableCell>
                <TableCell align="right">{r.gmvAttributed}</TableCell>
                <TableCell align="right">{r.driverEarningsTotal}</TableCell>
                <TableCell align="right">{r.platformFeesTotal}</TableCell>
                <TableCell align="right">{r.lossesFromCancelled}</TableCell>
                <TableCell align="right">{r.cancelledTrips}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Grid container spacing={2}>
        {summary && (
          <>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  GMV (завершені)
                </Typography>
                <Typography variant="h6">{summary.gmv} ₴</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  Комісія платформи
                </Typography>
                <Typography variant="h6">{summary.platformFees} ₴</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                <Typography variant="caption" color="text.secondary">
                  Завершені / усього
                </Typography>
                <Typography variant="h6">
                  {summary.ordersCompleted} / {summary.ordersTotal}
                </Typography>
              </Paper>
            </Grid>
          </>
        )}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
            <Typography variant="subtitle2" gutterBottom>
              Операційні витрати (OPEX)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Категорія</TableCell>
                  <TableCell align="right">Сума, ₴</TableCell>
                  <TableCell align="right">Записів</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opex &&
                  Object.entries(opex).map(([key, val]) => (
                    <TableRow key={key}>
                      <TableCell>{OPEX_LABELS[key] ?? key}</TableCell>
                      <TableCell align="right">{val.total ?? '0'}</TableCell>
                      <TableCell align="right">{val.records ?? val.transactions ?? '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Денна динаміка (завершені поїздки)
            </Typography>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chart} margin={{ top: 8, right: 8, left: 12, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'День (UTC)', position: 'insideBottom', offset: -28 }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Сума, ₴', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gmv" name="GMV" stroke="#FFB300" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="fees" name="Комісія" stroke="#7E57C2" dot={false} />
                <Line type="monotone" dataKey="drivers" name="Водіям" stroke="#43A047" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
