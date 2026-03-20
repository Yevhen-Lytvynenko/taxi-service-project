import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export const Clients = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchClients = async () => {
    try {
      const res = await api.get('/users');
      const clients = (res.data || [])
        .filter((u: any) => u.role === 'CLIENT')
        .map((u: any) => ({
          ...u,
          ordersCount: Array.isArray(u.clientOrders) ? u.clientOrders.length : 0,
        }));
      setRows(clients);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpen = (client?: any) => {
    if (client) {
      setEditId(client.id);
      setValue('fullName', client.fullName);
      setValue('phone', client.phone);
      setValue('email', client.email);
    } else {
      setEditId(null);
      reset({ fullName: '', phone: '', email: '' });
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Видалити клієнта?')) {
      await api.delete(`/users/${id}`);
      fetchClients();
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editId) {
        await api.put(`/users/${editId}`, { ...data, role: 'CLIENT' });
      } else {
        await api.post('/users', { ...data, role: 'CLIENT', password: 'password123' });
      }
      setOpen(false);
      fetchClients();
    } catch (error) {
      alert('Помилка збереження');
    }
  };

  const columns: GridColDef[] = [
    { field: 'fullName', headerName: 'ПІБ', flex: 1 },
    { field: 'phone', headerName: 'Телефон', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'ordersCount', headerName: 'Замовлень', width: 120 },
    {
      field: 'actions',
      headerName: 'Дії',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleOpen(params.row)}>
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.id as string)}>
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Клієнти</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Додати
        </Button>
      </Box>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editId ? 'Редагувати клієнта' : 'Новий клієнт'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} minWidth={300}>
              <TextField label="ПІБ" {...register('fullName')} fullWidth required />
              <TextField label="Телефон" {...register('phone')} fullWidth required />
              <TextField label="Email" {...register('email')} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Скасувати</Button>
            <Button type="submit" variant="contained">
              Зберегти
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
