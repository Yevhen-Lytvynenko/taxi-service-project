import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../api/axios';
import type { AnalyticsRange, DriverKpiRow } from './analyticsTypes';
import { AnalyticsHint } from './AnalyticsHint';

type Kpi = DriverKpiRow;

export const FleetPage = () => {
  const { fromIso, toIso, fromDate, toDate, refreshKey } = useOutletContext<AnalyticsRange>();
  const [rows, setRows] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<DriverKpiRow[]>('/analytics/fleet/driver-kpis', {
          params: { from: fromIso, to: toIso },
        });
        if (!c) setRows(res.data);
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

  const topByTrips = [...rows]
    .sort((a, b) => b.completedTrips - a.completedTrips)
    .slice(0, 12)
    .map((r) => ({
      name: r.fullName.split(' ')[0] ?? r.fullName,
      trips: r.completedTrips,
      rating: r.avgRating ?? 0,
    }));

  if (loading && !rows.length) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Ефективність водіїв та автопарку
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        KPI за період: {fromDate} — {toDate}
      </Typography>
      <AnalyticsHint>
        <Typography variant="body2" color="text.secondary">
          Зведення за завершеними рейсами, середнім рейтингом та орієнтовним часом онлайн із GPS. Поле «холодний пробіг» —
          наближена оцінка (години на лінії × 18 км/год мінус км із пасажиром); для точності потрібні повні треки.
        </Typography>
      </AnalyticsHint>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Топ водіїв за кількістю завершених поїздок
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topByTrips} margin={{ top: 28, right: 8, left: 8, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              label={{ value: 'Водій (скорочено)', position: 'insideBottom', offset: -28 }}
            />
            <YAxis
              allowDecimals={false}
              label={{ value: 'Завершених поїздок', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={28} />
            <Bar dataKey="trips" name="Поїздок" fill="#5C6BC0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 0, borderRadius: 2 }} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Водій</TableCell>
              <TableCell>Авто</TableCell>
              <TableCell>Вериф.</TableCell>
              <TableCell align="right">Поїздок</TableCell>
              <TableCell align="right">GMV</TableCell>
              <TableCell align="right">Виплати</TableCell>
              <TableCell align="right">Комісія</TableCell>
              <TableCell align="right">Втрати ск.</TableCell>
              <TableCell align="right">Скас.</TableCell>
              <TableCell align="right">Сер. чек</TableCell>
              <TableCell align="right">Рейтинг</TableCell>
              <TableCell align="right">Онлайн≈год</TableCell>
              <TableCell align="right">Холод. км≈</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.driverId} hover>
                <TableCell>{r.fullName}</TableCell>
                <TableCell sx={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.vehicle}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.verificationStatus ?? '—'}
                    color={r.verificationStatus === 'APPROVED' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{r.completedTrips}</TableCell>
                <TableCell align="right">{r.gmvAttributed}</TableCell>
                <TableCell align="right">{r.driverEarningsTotal}</TableCell>
                <TableCell align="right">{r.platformFeesTotal}</TableCell>
                <TableCell align="right">{r.lossesFromCancelled}</TableCell>
                <TableCell align="right">{r.cancelledTrips}</TableCell>
                <TableCell align="right">{r.avgCheck}</TableCell>
                <TableCell align="right">{r.avgRating != null ? r.avgRating.toFixed(2) : '—'}</TableCell>
                <TableCell align="right">{r.estimatedOnlineHours}</TableCell>
                <TableCell align="right">{r.coldKmApprox != null ? r.coldKmApprox : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
