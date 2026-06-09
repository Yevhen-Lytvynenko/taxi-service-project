import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildRowActionsColumn } from '../components/organisms/gridActions';
import { getStoredStaffRole, permAllows } from '../config/menuAccess';

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'] as const;

type OfficeRoleOpt = { id: string; displayName: string; legacyRole: string };
type UserRow = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  officeRoleId?: string | null;
  officeRole?: { displayName: string };
};

type UserFormValues = {
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  officeRoleId: string;
};

export const Users = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [officeRoles, setOfficeRoles] = useState<OfficeRoleOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm<UserFormValues>();

  const role = getStoredStaffRole();
  const canWriteUsers = !!(role && permAllows(role, 'users', 'write'));

  const loadOfficeRoles = useCallback(async () => {
    try {
      const res = await api.get<OfficeRoleOpt[]>('/office-roles');
      setOfficeRoles(res.data);
    } catch {
      /* ignore — не адмін */
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setRows(res.data as UserRow[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
    if (canWriteUsers) void loadOfficeRoles();
  }, [fetchUsers, loadOfficeRoles, canWriteUsers]);

  const handleOpen = (user?: UserRow) => {
    if (user) {
      setEditId(user.id);
      setValue('fullName', user.fullName);
      setValue('phone', user.phone);
      setValue('role', user.role);
      setValue('email', user.email ?? '');
      setValue('officeRoleId', user.officeRoleId ?? '');
    } else {
      setEditId(null);
      reset({ fullName: '', phone: '', email: '', role: 'CLIENT', officeRoleId: '' });
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити користувача?')) return;
    try {
      await api.delete(`/users/${id}`);
      void fetchUsers();
    } catch {
      alert('Помилка видалення користувача');
    }
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      const staff = STAFF_ROLES.includes(data.role as (typeof STAFF_ROLES)[number]);
      const payload: Record<string, unknown> = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        role: data.role,
      };
      if (canWriteUsers && staff && data.officeRoleId) {
        payload.officeRoleId = data.officeRoleId;
      }
      if (editId) {
        await api.put(`/users/${editId}`, payload);
      } else {
        await api.post('/users', { ...payload, password: 'password123' });
      }
      setOpen(false);
      void fetchUsers();
    } catch {
      alert('Помилка збереження');
    }
  };

  const formRole = watch('role');
  const showOfficeTemplate = canWriteUsers && STAFF_ROLES.includes(formRole as (typeof STAFF_ROLES)[number]);

  const columns: GridColDef<UserRow>[] = useMemo(
    () => [
      { field: 'fullName', headerName: 'ПІБ', flex: 1, minWidth: 180 },
      { field: 'phone', headerName: 'Телефон', flex: 1, minWidth: 140 },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      {
        field: 'role',
        headerName: 'Роль',
        width: 140,
        renderCell: (params) => {
          const colors: Record<string, 'error' | 'warning' | 'success' | 'default' | 'info' | 'secondary'> = {
            ADMIN: 'error',
            DRIVER: 'warning',
            CLIENT: 'success',
            MANAGER: 'info',
            DISPATCHER: 'secondary',
            ACCOUNTANT: 'warning',
          };
          return (
            <Chip
              label={String(params.value)}
              color={colors[String(params.value)] ?? 'default'}
              size="small"
            />
          );
        },
      },
      {
        field: 'officeRole',
        headerName: 'Шаблон офісу',
        flex: 1,
        minWidth: 160,
        valueGetter: (p) => p.row.officeRole?.displayName ?? '—',
      },
      ...(canWriteUsers
        ? [
            buildRowActionsColumn<UserRow>({
              onEdit: handleOpen,
              onDelete: handleDelete,
            }),
          ]
        : []),
    ],
    [canWriteUsers]
  );

  return (
    <>
      <AppDataGrid<UserRow>
        storageKey="users"
        rows={rows}
        columns={columns}
        loading={loading}
        title="Користувачі"
        subtitle="Всі акаунти системи — клієнти, водії, адміністратори"
        onCreate={canWriteUsers ? () => handleOpen() : undefined}
        onRefresh={() => void fetchUsers()}
        exportFileName="users"
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редагувати' : 'Новий користувач'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="ПІБ" {...register('fullName')} fullWidth required />
              <TextField label="Телефон" {...register('phone')} fullWidth required />
              <TextField label="Email" {...register('email')} fullWidth />
              <TextField select label="Роль" defaultValue="CLIENT" {...register('role')} fullWidth>
                <MenuItem value="CLIENT">Клієнт</MenuItem>
                <MenuItem value="DRIVER">Водій</MenuItem>
                <MenuItem value="ADMIN">Адміністратор</MenuItem>
                <MenuItem value="MANAGER">Менеджер</MenuItem>
                <MenuItem value="DISPATCHER">Диспетчер</MenuItem>
                <MenuItem value="ACCOUNTANT">Бухгалтер</MenuItem>
              </TextField>
              {showOfficeTemplate && (
                <TextField select label="Шаблон ролі офісу" {...register('officeRoleId')} fullWidth>
                  <MenuItem value="">— не призначено —</MenuItem>
                  {officeRoles.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.displayName} ({o.legacyRole})
                    </MenuItem>
                  ))}
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
