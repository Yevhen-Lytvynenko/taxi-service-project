import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildRowActionsColumn } from '../components/organisms/gridActions';

type ClientRow = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  ordersCount: number;
};

type ClientFormValues = {
  fullName: string;
  phone: string;
  email?: string;
};

export const Clients = () => {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<ClientFormValues>();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const clients: ClientRow[] = ((res.data as Array<Record<string, unknown>>) ?? [])
        .filter((u) => u.role === 'CLIENT')
        .map((u) => ({
          id: String(u.id),
          fullName: String(u.fullName ?? ''),
          phone: String(u.phone ?? ''),
          email: u.email ? String(u.email) : undefined,
          ordersCount: Array.isArray(u.clientOrders) ? u.clientOrders.length : 0,
        }));
      setRows(clients);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const handleOpen = (client?: ClientRow) => {
    if (client) {
      setEditId(client.id);
      setValue('fullName', client.fullName);
      setValue('phone', client.phone);
      setValue('email', client.email ?? '');
    } else {
      setEditId(null);
      reset({ fullName: '', phone: '', email: '' });
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити клієнта?')) return;
    try {
      await api.delete(`/users/${id}`);
      void fetchClients();
    } catch {
      alert('Помилка видалення клієнта');
    }
  };

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (editId) {
        await api.put(`/users/${editId}`, { ...data, role: 'CLIENT' });
      } else {
        await api.post('/users', { ...data, role: 'CLIENT', password: 'password123' });
      }
      setOpen(false);
      void fetchClients();
    } catch {
      alert('Помилка збереження');
    }
  };

  const columns: GridColDef<ClientRow>[] = [
    { field: 'fullName', headerName: 'ПІБ', flex: 1, minWidth: 180 },
    { field: 'phone', headerName: 'Телефон', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    { field: 'ordersCount', headerName: 'Замовлень', width: 120, type: 'number' },
    buildRowActionsColumn<ClientRow>({
      onEdit: handleOpen,
      onDelete: handleDelete,
    }),
  ];

  return (
    <>
      <AppDataGrid<ClientRow>
        storageKey="clients"
        rows={rows}
        columns={columns}
        loading={loading}
        title="Клієнти"
        subtitle="Користувачі з роллю CLIENT"
        onCreate={() => handleOpen()}
        onRefresh={() => void fetchClients()}
        exportFileName="clients"
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редагувати клієнта' : 'Новий клієнт'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
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
    </>
  );
};
