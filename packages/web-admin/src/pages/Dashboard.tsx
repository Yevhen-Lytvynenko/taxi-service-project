import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const driversRes = await api.get('/drivers');
        const ordersRes = await api.get('/orders');
        setDrivers(driversRes.data);
        setOrders(ordersRes.data);
      } catch (e: any) {
        console.error('Помилка завантаження', e);
        if (e.response && e.response.status === 401) {
          navigate('/login');
        }
      }
    };
    fetchData();
  }, [navigate]);

  const totalIncome = orders.reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const onlineDrivers = drivers.filter((d) => d.status === 'ONLINE').length;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mt: 0 }}>
        Дашборд
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Огляд ключових показників для демонстрації (узгоджені з замовленнями та водіями в БД)
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
        gap={3}
        mb={4}
      >
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Водіїв у базі
          </Typography>
          <Typography variant="h3" color="primary">
            {drivers.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Online зараз
          </Typography>
          <Typography variant="h3" color="success.main">
            {onlineDrivers}
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Замовлення
          </Typography>
          <Typography variant="h3" color="secondary">
            {orders.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            завершених: {completedCount}
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Сума чеків (усі статуси)
          </Typography>
          <Typography variant="h3" sx={{ color: 'success.main' }}>
            ₴ {totalIncome.toFixed(0)}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
          Водії (фрагмент)
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ім&apos;я</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Авто</TableCell>
              <TableCell>Номер</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.slice(0, 12).map((d) => (
              <TableRow key={d.id} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{d.user?.fullName || '—'}</TableCell>
                <TableCell>{d.user?.phone}</TableCell>
                <TableCell>
                  {d.vehicle?.model ? `${d.vehicle.model} (${d.vehicle.color})` : '—'}
                </TableCell>
                <TableCell>{d.vehicle?.plateNumber || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={d.status}
                    color={
                      d.status === 'ONLINE' ? 'success' : d.status === 'BUSY' ? 'warning' : 'default'
                    }
                    size="small"
                    variant="filled"
                  />
                </TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Немає водіїв у базі
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
