import { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useOutletContext } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/axios';
import type { AnalyticsRange } from './analyticsTypes';
import { AnalyticsHint } from './AnalyticsHint';

type GridResp = {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
  cellDegrees: number;
  topProfitableZones: {
    lat: number;
    lng: number;
    orderCount: number;
    avgCheck: number;
    completedRatio: number;
    intensity: number;
  }[];
  topHotspots: GridResp['topProfitableZones'];
};

const odessaCenter: [number, number] = [46.4825, 30.7233];

export const GeoPage = () => {
  const { fromIso, toIso, fromDate, toDate, refreshKey } = useOutletContext<AnalyticsRange>();
  const [geo, setGeo] = useState<GridResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<GridResp>('/analytics/geo/pickup-grid', {
          params: { from: fromIso, to: toIso, cell: 0.012 },
        });
        if (!c) setGeo(res.data);
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

  const styleFn = useMemo(() => {
    const max =
      geo?.features?.reduce(
        (m, f) => Math.max(m, (f.properties as { orderCount?: number })?.orderCount ?? 0),
        0
      ) ?? 1;
    return (feature: GeoJSON.Feature) => {
      const n = (feature.properties as { orderCount?: number })?.orderCount ?? 0;
      const t = max > 0 ? n / max : 0;
      return {
        fillColor: `rgba(255, 152, 0, ${0.15 + t * 0.75})`,
        weight: 1,
        opacity: 1,
        color: '#E65100',
        fillOpacity: 0.55,
      };
    };
  }, [geo]);

  const maxOrders =
    geo?.features?.reduce(
      (m, f) => Math.max(m, (f.properties as { orderCount?: number })?.orderCount ?? 0),
      0
    ) ?? 0;

  if (loading && !geo) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Геопросторова аналітика
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Обраний період: {fromDate} — {toDate}
      </Typography>
      <AnalyticsHint>
        <Typography variant="body2" color="text.secondary">
          Теплова сітка попиту за координатами підбору пасажира; таблиці — топ зон за середнім чеком та за кількістю замовлень.
          «Гарячі» комірки можна використовувати як орієнтири для чергування водіїв.
        </Typography>
      </AnalyticsHint>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }} variant="outlined">
            <Box sx={{ height: 420 }}>
              <MapContainer
                center={odessaCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {geo && (
                  <GeoJSON
                    key={`${fromIso}-${toIso}-${geo.features.length}`}
                    data={geo}
                    style={styleFn as L.StyleFunction}
                  />
                )}
              </MapContainer>
            </Box>
            <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                Легенда: щільність підборів по комірках сітки
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  менше
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 120,
                    height: 12,
                    borderRadius: 1,
                    background:
                      'linear-gradient(90deg, rgba(255,152,0,0.15) 0%, rgba(255,152,0,0.45) 50%, rgba(255,152,0,0.9) 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  більше замовлень
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Максимум у цьому періоді: {maxOrders} замовл./комірка · контур комірки — помаранчевий
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2, borderRadius: 2, maxHeight: 420, overflow: 'auto' }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Топ зон за середнім чеком
            </Typography>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Координати центру зони (широта / довгота)</TableCell>
                  <TableCell align="right">Замовлень</TableCell>
                  <TableCell align="right">Середній чек (₴)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(geo?.topProfitableZones ?? []).map((z, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {z.lat.toFixed(3)}, {z.lng.toFixed(3)}
                    </TableCell>
                    <TableCell align="right">{z.orderCount}</TableCell>
                    <TableCell align="right">{z.avgCheck.toFixed(0)} ₴</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Найбільший пасажиропотік (кількість підборів)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Координати центру зони (широта / довгота)</TableCell>
                  <TableCell align="right">Замовлень за період</TableCell>
                  <TableCell align="right">Частка завершених (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(geo?.topHotspots ?? []).map((z, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {z.lat.toFixed(3)}, {z.lng.toFixed(3)}
                    </TableCell>
                    <TableCell align="right">{z.orderCount}</TableCell>
                    <TableCell align="right">{(z.completedRatio * 100).toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
