import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildRowActionsColumn } from '../components/organisms/gridActions';
import { getStoredStaffRole, permAllows } from '../config/menuAccess';

type TariffRow = {
  id: string;
  name: string;
  basePrice: number;
  pricePerKm: number;
  minPrice: number;
  pricePerMin?: number;
};

type TariffFormValues = {
  name: string;
  basePrice: string | number;
  pricePerKm: string | number;
  minPrice: string | number;
  pricePerMin?: string | number;
};

function coerceNum(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (v != null && typeof v === 'object' && 'toString' in v) {
    const n = parseFloat(String((v as { toString(): string }).toString()));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function mapTariffRow(raw: Record<string, unknown>): TariffRow | null {
  const id = raw.id != null ? String(raw.id) : '';
  if (!id) return null;
  return {
    id,
    name: String(raw.name ?? ''),
    basePrice: coerceNum(raw.basePrice),
    pricePerKm: coerceNum(raw.pricePerKm),
    minPrice: coerceNum(raw.minPrice),
    pricePerMin: coerceNum(raw.pricePerMin ?? 0),
  };
}

export const Tariffs = () => {
  const [rows, setRows] = useState<TariffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<TariffFormValues>();

  const canMutate = useMemo(() => {
    const r = getStoredStaffRole();
    return !!(r && permAllows(r, 'tariffs', 'write'));
  }, []);

  const fetchTariffs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/tariffs');
      const raw = res.data;
      if (!Array.isArray(raw)) {
        setFetchError('Сервер повернув неочікуваний формат (очікувався масив тарифів).');
        setRows([]);
        return;
      }
      const mapped = raw
        .map((item) => mapTariffRow(item as Record<string, unknown>))
        .filter((x): x is TariffRow => x != null);
      setRows(mapped);
    } catch (e: unknown) {
      let msg = 'Не вдалося завантажити тарифи.';
      if (isAxiosError(e)) {
        const code = e.response?.status;
        if (code === 401) msg = 'Увійдіть у систему знову (токен протерміновано або відсутній).';
        else if (code === 403) msg = 'Недостатньо прав для перегляду тарифів.';
        else if (typeof e.response?.data === 'object' && e.response.data && 'error' in e.response.data) {
          msg = String((e.response.data as { error: unknown }).error);
        }
      }
      setFetchError(msg);
      setRows([]);
      console.error('Failed to fetch tariffs', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTariffs();
  }, [fetchTariffs]);

  const handleOpen = (tariff?: TariffRow) => {
    if (!canMutate) return;
    if (tariff) {
      setEditId(tariff.id);
      setValue('name', tariff.name);
      setValue('basePrice', tariff.basePrice);
      setValue('pricePerKm', tariff.pricePerKm);
      setValue('minPrice', tariff.minPrice);
      setValue('pricePerMin', tariff.pricePerMin ?? 0);
    } else {
      setEditId(null);
      reset();
    }
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canMutate) return;
    if (!window.confirm('Видалити тариф?')) return;
    try {
      await api.delete(`/tariffs/${id}`);
      void fetchTariffs();
    } catch {
      alert('Помилка видалення тарифу');
    }
  };

  const onSubmit = async (data: TariffFormValues) => {
    if (!canMutate) return;
    try {
      const payload = {
        ...data,
        basePrice: Number(data.basePrice),
        pricePerKm: Number(data.pricePerKm),
        minPrice: Number(data.minPrice),
        pricePerMin: Number(data.pricePerMin) || 0,
      };
      if (editId) {
        await api.put(`/tariffs/${editId}`, payload);
      } else {
        await api.post('/tariffs', payload);
      }
      setOpen(false);
      void fetchTariffs();
    } catch {
      alert('Помилка збереження тарифу');
    }
  };

  const columns: GridColDef<TariffRow>[] = [
    { field: 'name', headerName: 'Назва', flex: 1, minWidth: 140 },
    { field: 'basePrice', headerName: 'Посадка (грн)', type: 'number', width: 150 },
    { field: 'pricePerKm', headerName: 'Ціна/км', type: 'number', width: 120 },
    { field: 'minPrice', headerName: 'Мін. вартість', type: 'number', width: 140 },
    { field: 'pricePerMin', headerName: 'Ціна/хв', type: 'number', width: 120 },
    ...(canMutate
      ? [
          buildRowActionsColumn<TariffRow>({
            onEdit: handleOpen,
            onDelete: handleDelete,
          }),
        ]
      : []),
  ];

  return (
    <>
      {fetchError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchError}
        </Alert>
      ) : null}
      <AppDataGrid<TariffRow>
        storageKey="tariffs-grid"
        rows={rows}
        columns={columns}
        loading={loading}
        title="Тарифи"
        {...(canMutate ? { onCreate: () => handleOpen(), createLabel: 'Додати тариф' } : {})}
        onRefresh={() => void fetchTariffs()}
        exportFileName="tariffs"
      />

      {canMutate ? (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? 'Редагувати' : 'Новий тариф'}</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Код тарифу (CarClass)"
                  placeholder="ECONOMY, STANDARD, COMFORT, EXPRESS, DELIVERY…"
                  {...register('name')}
                  fullWidth
                  required
                />
                <TextField
                  label="Посадка"
                  type="number"
                  {...register('basePrice')}
                  fullWidth
                  required
                />
                <TextField
                  label="Ціна за км"
                  type="number"
                  {...register('pricePerKm')}
                  fullWidth
                  required
                />
                <TextField
                  label="Мін. вартість"
                  type="number"
                  {...register('minPrice')}
                  fullWidth
                  required
                />
                <TextField
                  label="Ціна за хвилину"
                  type="number"
                  {...register('pricePerMin')}
                  fullWidth
                />
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
      ) : null}
    </>
  );
};
