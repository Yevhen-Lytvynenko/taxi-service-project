import { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Chip 
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export const Users = () => {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setRows(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user?: any) => {
    if (user) {
      setEditId(user.id);
      setValue('fullName', user.fullName);
      setValue('phone', user.phone);
      setValue('role', user.role);
      setValue('email', user.email);
    } else {
      setEditId(null);
      reset();
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Видалити користувача?')) {
      await api.delete(`/users/${id}`);
      fetchUsers();
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editId) {
        await api.put(`/users/${editId}`, data);
      } else {
        await api.post('/users', { ...data, password: 'password123' });
      }
      setOpen(false);
      fetchUsers();
    } catch (error) {
      alert('Помилка збереження');
    }
  };

  const columns: GridColDef[] = [
    { field: 'fullName', headerName: 'ПІБ', flex: 1 },
    { field: 'phone', headerName: 'Телефон', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { 
      field: 'role', 
      headerName: 'Роль', 
      width: 120,
      renderCell: (params) => {
        const colors: any = { ADMIN: 'error', DRIVER: 'warning', CLIENT: 'success' };
        return <Chip label={params.value} color={colors[params.value] || 'default'} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Дії',
      width: 120,
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
        <Typography variant="h4">Користувачі</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Додати</Button>
      </Box>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} pageSizeOptions={[10]} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editId ? 'Редагувати' : 'Новий користувач'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} minWidth={300}>
              <TextField label="ПІБ" {...register('fullName')} fullWidth required />
              <TextField label="Телефон" {...register('phone')} fullWidth required />
              <TextField label="Email" {...register('email')} fullWidth />
              <TextField select label="Роль" defaultValue="CLIENT" {...register('role')} fullWidth>
                <MenuItem value="CLIENT">Клієнт</MenuItem>
                <MenuItem value="DRIVER">Водій</MenuItem>
                <MenuItem value="ADMIN">Адміністратор</MenuItem>
              </TextField>
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