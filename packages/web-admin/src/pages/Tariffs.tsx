import { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField 
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export const Tariffs = () => {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchTariffs = async () => {
    const res = await api.get('/tariffs');
    setRows(res.data);
  };

  useEffect(() => { fetchTariffs(); }, []);

  const handleOpen = (tariff?: any) => {
    if (tariff) {
      setEditId(tariff.id);
      setValue('name', tariff.name);
      setValue('basePrice', tariff.basePrice);
      setValue('pricePerKm', tariff.pricePerKm);
      setValue('minPrice', tariff.minPrice);
    } else {
      setEditId(null);
      reset();
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Видалити тариф?')) {
      await api.delete(`/tariffs/${id}`);
      fetchTariffs();
    }
  };

  const onSubmit = async (data: any) => {
    const payload = {
        ...data,
        basePrice: Number(data.basePrice),
        pricePerKm: Number(data.pricePerKm),
        minPrice: Number(data.minPrice),
        pricePerMin: 0
    };

    if (editId) {
      await api.put(`/tariffs/${editId}`, payload);
    } else {
      await api.post('/tariffs', payload);
    }
    setOpen(false);
    fetchTariffs();
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Назва', flex: 1 },
    { field: 'basePrice', headerName: 'Посадка (грн)', flex: 1 },
    { field: 'pricePerKm', headerName: 'Ціна/км', flex: 1 },
    { field: 'minPrice', headerName: 'Мін. вартість', flex: 1 },
    {
      field: 'actions',
      headerName: 'Дії',
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleOpen(params.row)}><Edit /></IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.id as string)}><Delete /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Тарифи</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Додати тариф</Button>
      </Box>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} pageSizeOptions={[10]} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editId ? 'Редагувати' : 'Новий тариф'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} minWidth={300}>
              <TextField label="Назва (напр. ECONOMY)" {...register('name')} fullWidth required />
              <TextField label="Посадка" type="number" {...register('basePrice')} fullWidth required />
              <TextField label="Ціна за км" type="number" {...register('pricePerKm')} fullWidth required />
              <TextField label="Мін. вартість" type="number" {...register('minPrice')} fullWidth required />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Скасувати</Button>
            <Button type="submit" variant="contained">Зберегти</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};