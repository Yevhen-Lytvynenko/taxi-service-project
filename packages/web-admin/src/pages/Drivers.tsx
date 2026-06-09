import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildGpsColumn, buildRowActionsColumn } from '../components/organisms/gridActions';

type DriverRow = {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicleModel: string;
  vehiclePlate: string;
  status: string;
};

type DriverFormValues = {
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicleModel: string;
  vehiclePlate: string;
  status: string;
};

export const Drivers = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<DriverFormValues>();

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers');
      const formatted: DriverRow[] = (res.data as Array<Record<string, any>>).map((d) => ({
        id: String(d.id),
        fullName: d.user?.fullName ?? 'N/A',
        phone: d.user?.phone ?? '',
        licenseNumber: d.licenseNumber ?? '',
        vehicleModel: d.vehicle?.model ?? '-',
        vehiclePlate: d.vehicle?.plateNumber ?? '-',
        status: String(d.status ?? 'OFFLINE'),
      }));
      setRows(formatted);
    } catch (error) {
      console.error('Failed to fetch drivers', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

  const handleOpen = (driver?: DriverRow) => {
    if (driver) {
      setEditId(driver.id);
      setValue('fullName', driver.fullName);
      setValue('phone', driver.phone);
      setValue('licenseNumber', driver.licenseNumber);
      setValue('vehicleModel', driver.vehicleModel);
      setValue('vehiclePlate', driver.vehiclePlate);
      setValue('status', driver.status);
    } else {
      setEditId(null);
      reset();
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити водія?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      void fetchDrivers();
    } catch {
      alert('Помилка видалення водія');
    }
  };

  const onSubmit = async (data: DriverFormValues) => {
    try {
      if (editId) {
        await api.put(`/drivers/${editId}`, data);
      } else {
        await api.post('/users', {
          phone: data.phone,
          fullName: data.fullName,
          role: 'DRIVER',
          password: 'driver_password',
          driverProfile: {
            create: {
              licenseNumber: data.licenseNumber,
              status: 'OFFLINE',
              vehicle: {
                create: {
                  model: data.vehicleModel,
                  plateNumber: data.vehiclePlate,
                  color: 'White',
                  productionYear: 2020,
                  carClass: 'ECONOMY',
                },
              },
            },
          },
        });
      }
      setOpen(false);
      void fetchDrivers();
    } catch {
      alert('Помилка збереження');
    }
  };

  const columns: GridColDef<DriverRow>[] = [
    buildGpsColumn<DriverRow>((row) => row.id, navigate),
    { field: 'fullName', headerName: "Ім'я", flex: 1, minWidth: 180 },
    { field: 'phone', headerName: 'Телефон', flex: 1, minWidth: 140 },
    { field: 'licenseNumber', headerName: 'Права', width: 130 },
    { field: 'vehicleModel', headerName: 'Авто', flex: 1, minWidth: 140 },
    { field: 'vehiclePlate', headerName: 'Номер', width: 130 },
    {
      field: 'status',
      headerName: 'Статус',
      width: 120,
      renderCell: (params) => {
        const v = String(params.value);
        const color: 'success' | 'warning' | 'default' =
          v === 'ONLINE' ? 'success' : v === 'BUSY' ? 'warning' : 'default';
        return <Chip label={v} color={color} size="small" />;
      },
    },
    buildRowActionsColumn<DriverRow>({
      onEdit: handleOpen,
      onDelete: handleDelete,
    }),
  ];

  return (
    <>
      <AppDataGrid<DriverRow>
        storageKey="drivers"
        rows={rows}
        columns={columns}
        loading={loading}
        title="Водії"
        subtitle="Іконка GPS — перехід на стежування за водієм у реальному часі"
        onCreate={() => handleOpen()}
        createLabel="Додати водія"
        onRefresh={() => void fetchDrivers()}
        exportFileName="drivers"
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редагувати водія' : 'Новий водій'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="ПІБ" fullWidth {...register('fullName', { required: true })} />
              <TextField label="Телефон" fullWidth {...register('phone', { required: true })} />
              <TextField label="Номер прав" fullWidth {...register('licenseNumber')} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Транспорт
              </Typography>
              <TextField label="Модель авто" fullWidth {...register('vehicleModel')} />
              <TextField label="Номерний знак" fullWidth {...register('vehiclePlate')} />

              {editId && (
                <TextField
                  select
                  label="Статус"
                  defaultValue="OFFLINE"
                  fullWidth
                  {...register('status')}
                >
                  <MenuItem value="ONLINE">ONLINE</MenuItem>
                  <MenuItem value="BUSY">BUSY</MenuItem>
                  <MenuItem value="OFFLINE">OFFLINE</MenuItem>
                </TextField>
              )}
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
