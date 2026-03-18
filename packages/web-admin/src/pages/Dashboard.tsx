import { useEffect, useState } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Button, Container, Paper, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip 
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
        console.error("Помилка завантаження", e);
        if (e.response && e.response.status === 401) {
             navigate('/login');
        }
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Підрахунок доходу
  const totalIncome = orders.reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Верхня панель */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Taxi Admin Panel
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Вихід</Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        
        {/* СТАТИСТИКА: Використовуємо CSS Grid через Box */}
        {/* Це працює стабільно в будь-якій версії MUI */}
        <Box 
          display="grid" 
          gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} 
          gap={3} 
          mb={4}
        >
          {/* Картка 1 */}
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Всього Водіїв</Typography>
            <Typography variant="h3" color="primary">
              {drivers.length}
            </Typography>
          </Paper>

          {/* Картка 2 */}
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Всього Замовлень</Typography>
            <Typography variant="h3" color="secondary">
              {orders.length}
            </Typography>
          </Paper>

          {/* Картка 3 */}
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">Дохід системи</Typography>
            <Typography variant="h3" sx={{ color: 'success.main' }}>
              ₴ {totalIncome.toFixed(0)}
            </Typography>
          </Paper>
        </Box>

        {/* ТАБЛИЦЯ ВОДІЇВ */}
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
            Моніторинг водіїв
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ім'я</TableCell>
                <TableCell>Телефон</TableCell>
                <TableCell>Авто</TableCell>
                <TableCell>Номер</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{d.user?.fullName || 'Невідомо'}</TableCell>
                  <TableCell>{d.user?.phone}</TableCell>
                  <TableCell>{d.vehicle?.model ? `${d.vehicle.model} (${d.vehicle.color})` : '-'}</TableCell>
                  <TableCell>{d.vehicle?.plateNumber || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={d.status} 
                      color={d.status === 'ONLINE' ? 'success' : d.status === 'BUSY' ? 'warning' : 'default'} 
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="textSecondary">
                        Немає водіїв у базі даних
                      </Typography>
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

      </Container>
    </Box>
  );
};