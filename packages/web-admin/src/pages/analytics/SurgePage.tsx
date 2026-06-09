import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';
import api from '../../api/axios';
import type { AnalyticsRange } from './analyticsTypes';
import { AnalyticsHint } from './AnalyticsHint';

type Row = {
  bucketUtc: string;
  avgSurge: number;
  orderCount: number;
  avgCheck: string;
};

export const SurgePage = () => {
  const { fromIso, toIso, fromDate, toDate, refreshKey } = useOutletContext<AnalyticsRange>();
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = { from: fromIso, to: toIso };
        const res = await api.get<Row[]>('/analytics/surge/timeseries', { params: q });
        if (!c) setData(res.data);
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
  }, [fromIso, toIso, refreshKey]);

  const chart = data.map((r) => ({
    t: new Date(r.bucketUtc).toLocaleString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit' }),
    surge: Math.round(r.avgSurge * 1000) / 1000,
    orders: r.orderCount,
    check: Number(r.avgCheck),
  }));

  const avgSurgeAll =
    data.length > 0 ? data.reduce((a, b) => a + b.avgSurge, 0) / data.length : 1;

  if (loading && !data.length) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Динамічне ціноутворення (Surge)
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Обраний період фільтрує дані на цьому екрані: {fromDate} — {toDate}
      </Typography>
      <AnalyticsHint>
        <Typography variant="body2" color="text.secondary" component="div">
          Коефіцієнти{' '}
          <Chip size="small" label="surgeMultiplier" sx={{ verticalAlign: 'middle', mx: 0.5 }} /> зберігаються на кожному замовленні;
          графік показує середній surge та обсяг за години створення замовлень у межах періоду. Пікові множники при створенні поїздки
          задаються правилом часу доби на бекенді (<code>SURGE_PEAK_MULTIPLIER</code>).
        </Typography>
      </AnalyticsHint>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
            <Typography color="text.secondary" variant="caption">
              Середній surge за період
            </Typography>
            <Typography variant="h4" color="warning.main">
              ×{avgSurgeAll.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2, height: 420 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Surge та обсяг замовлень по годинах
            </Typography>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={chart} margin={{ top: 28, right: 16, left: 8, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9 }}
                  interval={7}
                  label={{ value: 'Час (година)', position: 'insideBottom', offset: -28 }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                  label={{ value: 'Замовлень', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Коефіцієнт surge', angle: 90, position: 'insideRight' }}
                />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar yAxisId="left" dataKey="orders" name="Замовлень" fill="#BDBDBD" radius={[2, 2, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="surge"
                  name="Сер. surge"
                  stroke="#F57C00"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
