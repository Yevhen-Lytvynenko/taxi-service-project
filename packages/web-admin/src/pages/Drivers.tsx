import { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Chip 
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

// Типи даних (спрощені)
interface DriverData {
  id?: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicleModel: string;
  vehiclePlate: string;
  status: string;
}

export const Drivers = () => {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false); // Стан модального вікна
  const [editId, setEditId] = useState<string | null>(null); // Якщо null - створюємо, якщо є ID - редагуємо

  // React Hook Form для зручної роботи з формами
  const { register, handleSubmit, reset, setValue } = useForm<DriverData>();

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ
  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      // Форматуємо дані для таблиці (плоска структура)
      const formatted = res.data.map((d: any) => ({
        id: d.id,
        fullName: d.user?.fullName || 'N/A',
        phone: d.user?.phone,
        licenseNumber: d.licenseNumber,
        vehicleModel: d.vehicle?.model || '-',
        vehiclePlate: d.vehicle?.plateNumber || '-',
        status: d.status
      }));
      setRows(formatted);
    } catch (error) {
      console.error('Failed to fetch drivers', error);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // 2. ОБРОБНИКИ (ACTIONS)
  const handleOpen = (driver?: any) => {
    if (driver) {
      // Режим редагування: заповнюємо форму
      setEditId(driver.id);
      setValue('fullName', driver.fullName);
      setValue('phone', driver.phone);
      setValue('licenseNumber', driver.licenseNumber);
      setValue('vehicleModel', driver.vehicleModel);
      setValue('vehiclePlate', driver.vehiclePlate);
      setValue('status', driver.status);
    } else {
      // Режим створення: чистимо форму
      setEditId(null);
      reset();
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити водія?')) {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    }
  };

  const onSubmit = async (data: DriverData) => {
    try {
      if (editId) {
        // Логіка оновлення (тут спрощено, в реальності треба оновлювати і User, і DriverProfile)
        // Для MVP можна відправляти запит на бекенд, який це розрулить
        await api.put(`/drivers/${editId}`, data); 
      } else {
        // Логіка створення
        // УВАГА: Тут ви маєте викликати правильний ендпоінт створення
        // Для прикладу:
        await api.post('/users', {
            phone: data.phone,
            fullName: data.fullName,
            role: 'DRIVER',
            password: 'driver_password', // Тимчасовий пароль
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
                            carClass: 'ECONOMY'
                        }
                    }
                }
            }
        });
      }
      setOpen(false);
      fetchDrivers();
    } catch (error) {
      alert('Помилка збереження');
    }
  };

  // 3. КОЛОНКИ ТАБЛИЦІ
  const columns: GridColDef[] = [
    { field: 'fullName', headerName: 'Ім\'я', flex: 1 },
    { field: 'phone', headerName: 'Телефон', flex: 1 },
    { field: 'vehicleModel', headerName: 'Авто', flex: 1 },
    { 
      field: 'status', 
      headerName: 'Статус', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'ONLINE' ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Дії',
      width: 150,
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
        <Typography variant="h4">Водії</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Додати водія
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

      {/* Модальне вікно (Dialog) */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редагувати водія' : 'Новий водій'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="ПІБ" fullWidth {...register('fullName', { required: true })} />
              <TextField label="Телефон" fullWidth {...register('phone', { required: true })} />
              <TextField label="Номер прав" fullWidth {...register('licenseNumber')} />
              
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Транспорт</Typography>
              <TextField label="Модель авто" fullWidth {...register('vehicleModel')} />
              <TextField label="Номерний знак" fullWidth {...register('vehiclePlate')} />
              
              {editId && (
                <TextField select label="Статус" defaultValue="OFFLINE" fullWidth {...register('status')}>
                  <MenuItem value="ONLINE">ONLINE</MenuItem>
                  <MenuItem value="BUSY">BUSY</MenuItem>
                  <MenuItem value="OFFLINE">OFFLINE</MenuItem>
                </TextField>
              )}
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