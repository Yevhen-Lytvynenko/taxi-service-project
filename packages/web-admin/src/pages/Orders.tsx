import { useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton, Chip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Delete } from '@mui/icons-material';
import api from '../api/axios';

export const Orders = () => {
  const [rows, setRows] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const formatted = res.data.map((order: any) => ({
        id: order.id,
        from: order.pickupAddress,
        to: order.dropoffAddress,
        price: `${order.totalPrice} грн`,
        status: order.status,
        driverName: order.driver?.user?.fullName || 'Пошук...',
        clientName: order.client?.fullName || 'Невідомо',
        createdAt: new Date(order.createdAt).toLocaleString()
      }));
      setRows(formatted);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Видалити замовлення?')) {
      await api.delete(`/orders/${id}`);
      fetchOrders();
    }
  };

  const columns: GridColDef[] = [
    { field: 'createdAt', headerName: 'Дата', width: 150 },
    { field: 'from', headerName: 'Звідки', flex: 1 },
    { field: 'to', headerName: 'Куди', flex: 1 },
    { field: 'price', headerName: 'Ціна', width: 100 },
    { 
      field: 'status', 
      headerName: 'Статус', 
      width: 130,
      renderCell: (params) => {
         const color = params.value === 'COMPLETED' ? 'success' : params.value === 'CANCELLED' ? 'error' : 'primary';
         return <Chip label={params.value} color={color} size="small" />;
      }
    },
    { field: 'driverName', headerName: 'Водій', flex: 1 },
    {
      field: 'actions',
      headerName: 'Дії',
      renderCell: (params) => (
        <IconButton color="error" onClick={() => handleDelete(params.id as string)}><Delete /></IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={2}>Історія Замовлень</Typography>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} pageSizeOptions={[10]} disableRowSelectionOnClick />
      </Paper>
    </Box>
  );
};