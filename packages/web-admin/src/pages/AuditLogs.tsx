import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import api from '../api/axios';

type AuditRow = {
  id: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  ip?: string | null;
  createdAt: string;
  metadata?: unknown;
  user?: { fullName?: string; username?: string; role?: string };
};

export function AuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { from: `${from}T00:00:00`, to: `${to}T23:59:59`, limit: 500 },
      });
      setRows(res.data as AuditRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Журнал аудиту
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          <TextField
            label="Від"
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="До"
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={() => void load()}>
            Оновити
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Час</TableCell>
                <TableCell>Користувач</TableCell>
                <TableCell>Дія</TableCell>
                <TableCell>Сутність</TableCell>
                <TableCell>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.createdAt).toLocaleString('uk-UA')}</TableCell>
                  <TableCell>
                    {r.user?.fullName || r.user?.username || '—'} {r.user?.role ? `(${r.user.role})` : ''}
                  </TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>
                    {r.entity ?? ''} {r.entityId ? `· ${r.entityId.slice(0, 8)}…` : ''}
                  </TableCell>
                  <TableCell>{r.ip ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
