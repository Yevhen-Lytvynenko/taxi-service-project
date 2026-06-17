import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';
import api from '../../api/axios';
import type { AnalyticsRange } from './analyticsTypes';
import { AnalyticsHint } from './AnalyticsHint';

type Hourly = { bucketUtc: string; orderCount: number };
type PeakBlock = {
  mean: number;
  stdDev: number;
  threshold: number;
  peaks: { bucketUtc: string; orderCount: number; zScore: number }[];
};
type Forecast = {
  methodology?: string;
  methodologyUk?: string;
  historyBuckets: number;
  forecastAnchorUtc?: string;
  forecast: {
    bucketUtc: string;
    predictedOrders: number;
    isWeekend: boolean;
    isHoliday: boolean;
  }[];
};

function formatPeakDeviation(count: number, mean: number): string {
  if (mean <= 0) return `${count} замовлень`;
  const pct = Math.round(((count - mean) / mean) * 100);
  if (pct <= 5) return 'На рівні середнього';
  return `+${pct}% від середнього`;
}

export const DemandPage = () => {
  const { fromIso, toIso, fromDate, toDate, refreshKey } = useOutletContext<AnalyticsRange>();
  const [series, setSeries] = useState<Hourly[]>([]);
  const [peaks, setPeaks] = useState<PeakBlock | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = { from: fromIso, to: toIso };
        const [s, p, f] = await Promise.all([
          api.get<Hourly[]>('/analytics/demand/hourly', { params: q }),
          api.get<PeakBlock>('/analytics/demand/peaks', { params: q }),
          api.get<Forecast>('/analytics/demand/forecast', { params: q }),
        ]);
        if (!cancel) {
          setSeries(s.data);
          setPeaks(p.data);
          setForecast(f.data);
        }
      } catch (e: unknown) {
        if (!cancel) {
          const ax = e as { response?: { data?: { error?: string } } };
          setError(ax.response?.data?.error ?? 'Помилка завантаження');
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [fromIso, toIso, refreshKey]);

  const chartDemand = series.map((r) => ({
    t: new Date(r.bucketUtc).toLocaleString('uk-UA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
    orders: r.orderCount,
  }));

  const chartForecast = (forecast?.forecast ?? []).map((r) => ({
    t: new Date(r.bucketUtc).toLocaleString('uk-UA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
    predicted: r.predictedOrders,
    weekend: r.isWeekend,
  }));

  const peakBars = (peaks?.peaks ?? []).slice(0, 12).map((p) => ({
    name: new Date(p.bucketUtc).toLocaleString('uk-UA', { weekday: 'short', hour: '2-digit' }),
    count: p.orderCount,
  }));

  const peakCount = peaks?.peaks?.length ?? 0;
  const meanOrders = peaks?.mean ?? 0;

  if (loading && !series.length) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Прогнозування попиту та пікових навантажень
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Обраний період: {fromDate} — {toDate}
      </Typography>
      <AnalyticsHint>
        <Typography variant="body2" color="text.secondary" component="div">
          Годинний профіль створених замовлень за період, автоматичне виділення «годин пік» та прогноз наступних 168 годин від{' '}
          <strong>кінця обраного періоду</strong> (або від «сьогодні», якщо кінець періоду у майбутньому) на базі середнього по «день
          тижня × година» з коригуваннями вихідних і свят.
        </Typography>
      </AnalyticsHint>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2, borderRadius: 2, height: 380 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Фактичний попит (замовлення / година)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartDemand} margin={{ top: 8, right: 8, left: 12, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  label={{ value: 'Час (година)', position: 'insideBottom', offset: -28 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  label={{ value: 'Замовлень за годину', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip labelFormatter={(label) => `Час: ${label}`} />
                <Legend verticalAlign="top" height={28} />
                <Area
                  type="monotone"
                  connectNulls
                  dataKey="orders"
                  name="Замовлень"
                  stroke="#FFB300"
                  fill="#FFD54F"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2, borderRadius: 2, height: 380 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Топ «годин пік» (авто)
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
              Пікова година — коли замовлень більше ~{peaks?.threshold.toFixed(1) ?? '—'} на годину
            </Typography>
            {peakCount < 2 ? (
              <Box
                sx={{
                  height: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">Недостатньо даних за період</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={peakBars}
                  layout="vertical"
                  margin={{ left: 4, right: 16, bottom: 8, top: 28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    label={{ value: 'Кількість замовлень', position: 'insideBottom', offset: -4 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip labelFormatter={(label) => `Час: ${label}`} />
                  <Legend verticalAlign="top" height={22} />
                  <Bar dataKey="count" name="Замовлень" fill="#FF8F00" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Прогноз на 7 днів (годинні оцінки)
              </Typography>
              <IconButton size="small" aria-label="Методологія прогнозу" onClick={() => setMethodologyOpen(true)}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Прогноз на 7 днів на основі профілю попиту за обраний період
              {forecast?.forecastAnchorUtc != null && (
                <>
                  {' '}
                  · від{' '}
                  {new Date(forecast.forecastAnchorUtc).toLocaleString('uk-UA', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </>
              )}
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartForecast} margin={{ top: 8, right: 8, left: 12, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9 }}
                  interval={11}
                  label={{ value: 'Час (прогнозний горизонт)', position: 'insideBottom', offset: -28 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Очікуваних замовлень за годину', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip labelFormatter={(label) => `Час: ${label}`} />
                <Legend verticalAlign="top" height={28} />
                <Line type="monotone" dataKey="predicted" name="Очікувано замовлень" stroke="#43A047" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Деталізація піків
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Час</TableCell>
                  <TableCell align="right">Замовлень</TableCell>
                  <TableCell align="right">Відхилення від середнього</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(peaks?.peaks ?? []).slice(0, 25).map((r) => (
                  <TableRow key={r.bucketUtc}>
                    <TableCell>{new Date(r.bucketUtc).toLocaleString('uk-UA')}</TableCell>
                    <TableCell align="right">{r.orderCount}</TableCell>
                    <TableCell align="right">{formatPeakDeviation(r.orderCount, meanOrders)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={methodologyOpen} onClose={() => setMethodologyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Методологія прогнозу</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {forecast?.methodologyUk ??
              'Середнє замовлень за годину для кожної пари «день тижня × година», прогноз на 168 год вперед з коригуваннями на вихідні та свята.'}
          </Typography>
          {forecast?.methodology && (
            <Typography variant="caption" color="text.disabled" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {forecast.methodology}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMethodologyOpen(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
