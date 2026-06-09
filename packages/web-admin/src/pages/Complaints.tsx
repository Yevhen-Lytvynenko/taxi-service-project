import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import api from '../api/axios';

type ComplaintRow = {
  id: string;
  subjectText: string;
  status: string;
  createdAt: string;
  author?: { fullName?: string; phone?: string };
  order?: { id: string; status?: string };
};

export function ComplaintsPage() {
  const [rows, setRows] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: { from: `${from}T00:00:00`, to: `${to}T23:59:59` },
      });
      setRows(res.data as ComplaintRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    await api.patch(`/complaints/${id}/status`, { status });
    await load();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Скарги клієнтів
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
                <TableCell>Дата</TableCell>
                <TableCell>Клієнт</TableCell>
                <TableCell>Текст</TableCell>
                <TableCell>Замовлення</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.createdAt).toLocaleString('uk-UA')}</TableCell>
                  <TableCell>{r.author?.fullName || r.author?.phone || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{r.subjectText}</TableCell>
                  <TableCell>{r.order?.id?.slice(0, 8) ?? '—'}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Статус</InputLabel>
                      <Select
                        label="Статус"
                        value={r.status}
                        onChange={(e) => void setStatus(r.id, e.target.value)}
                      >
                        <MenuItem value="OPEN">OPEN</MenuItem>
                        <MenuItem value="IN_REVIEW">IN_REVIEW</MenuItem>
                        <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                        <MenuItem value="DISMISSED">DISMISSED</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
