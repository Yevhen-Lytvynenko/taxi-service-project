import { useMemo, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import type { AnalyticsRange } from './analyticsTypes';
import { toIsoEndOfDay, toIsoStartOfDay } from './analyticsTypes';
import { AnalyticsHint } from './AnalyticsHint';

export const analyticsSectionNav = [
  { to: 'demand', label: 'Прогноз і піки' },
  { to: 'surge', label: 'Surge / ціноутворення' },
  { to: 'geo', label: 'Гео та теплокарти' },
  { to: 'fleet', label: 'Водії та автопарк' },
  { to: 'finance', label: 'Фінанси та звіти' },
] as const;

function defaultFrom(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

function titleFromPath(pathname: string): string {
  const seg = pathname.replace(/\/+$/, '').split('/').pop() ?? 'demand';
  const item = analyticsSectionNav.find((n) => n.to === seg);
  return item?.label ?? 'Аналітика';
}

export const AnalyticsLayout = () => {
  const location = useLocation();
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const pageTitle = titleFromPath(location.pathname);

  const ctx = useMemo<AnalyticsRange>(
    () => ({
      fromDate,
      toDate,
      fromIso: toIsoStartOfDay(fromDate),
      toIso: toIsoEndOfDay(toDate),
      setFromDate,
      setToDate,
      refreshKey,
      bumpRefresh,
    }),
    [fromDate, toDate, refreshKey, bumpRefresh]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
        {pageTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Розділи змінюються в меню «Аналітика». Період нижче застосовується до всіх екранів цього модуля (натисніть «Застосувати»
        після зміни дат).
      </Typography>

      <AnalyticsHint title="Докладніше про модуль аналітики">
        <>
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
            Демонстраційний модуль: попит у часі, surge, гео-щільність, KPI водіїв і фінансові зрізи поверх замовлень і треків.
            Докладний опис метрик — у{' '}
            <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
              packages/web-admin/docs/analytics-module-overview.md
            </Typography>
            .
          </Typography>
          <List dense disablePadding>
            <ListItem disableGutters>
              <ListItemText primary="Попит" secondary="Годинні ряди, піки, прогноз наступних інтервалів." />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText primary="Surge / ціна" secondary="Динаміка націнки та узгодженість із тарифами." />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText primary="Гео" secondary="Теплокарти подачі по сітці." />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText primary="Флот" secondary="Завантаженість водіїв, completion rate." />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText primary="Фінанси" secondary="Денні агрегати виручки та експорт." />
            </ListItem>
          </List>
        </>
      </AnalyticsHint>

      <Divider sx={{ mb: 2 }} />

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }} variant="outlined">
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Період аналізу (для всіх екранів модуля)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Від"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="До"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={bumpRefresh}>
            Застосувати
          </Button>
        </Box>
      </Paper>

      <Outlet context={ctx} />
    </Box>
  );
};
