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
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildChatColumn, buildRowActionsColumn } from '../components/organisms/gridActions';
import { TripChatDialog } from '../components/organisms/TripChatDialog';
import { getStoredStaffRole, permAllows } from '../config/menuAccess';

type OrderRow = {
  id: string;
  from: string;
  to: string;
  price: string;
  status: string;
  driverName: string;
  clientName: string;
  createdAt: string;
};

function statusColor(s: string): 'success' | 'error' | 'warning' | 'primary' | 'default' {
  if (s === 'COMPLETED') return 'success';
  if (s === 'CANCELLED') return 'error';
  if (s === 'SEARCHING') return 'warning';
  if (s === 'ACCEPTED' || s === 'ARRIVED' || s === 'IN_PROGRESS') return 'primary';
  return 'default';
}

type TariffOpt = { id: string; name: string };

export const Orders = () => {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [tariffs, setTariffs] = useState<TariffOpt[]>([]);
  const [dPhone, setDPhone] = useState('');
  const [dName, setDName] = useState('');
  const [dFrom, setDFrom] = useState('');
  const [dTo, setDTo] = useState('');
  const [dTariff, setDTariff] = useState('');
  const [dNotes, setDNotes] = useState('');
  const [dispatchBusy, setDispatchBusy] = useState(false);

  const role = getStoredStaffRole();
  const canDeleteOrders = !!(role && permAllows(role, 'orders', 'write'));
  const canDispatch = !!(role && permAllows(role, 'dispatch', 'write'));
  const canChat = !!(role && permAllows(role, 'chats', 'read'));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const formatted: OrderRow[] = (res.data as Array<Record<string, unknown>>).map((order) => {
        const driver = order.driver as { user?: { fullName?: string } } | null | undefined;
        const client = order.client as { fullName?: string } | null | undefined;
        return {
        id: String(order.id),
        from: String(order.pickupAddress ?? ''),
        to: String(order.dropoffAddress ?? ''),
        price: `${order.totalPrice} грн`,
        status: String(order.status ?? ''),
        driverName: driver?.user?.fullName ?? 'Пошук…',
        clientName: client?.fullName ?? 'Невідомо',
        createdAt: order.createdAt ? new Date(String(order.createdAt)).toLocaleString() : '—',
      };
      });
      setRows(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTariffs = useCallback(async () => {
    try {
      const res = await api.get<Array<{ id: string; name: string }>>('/tariffs');
      setTariffs(res.data.map((t) => ({ id: t.id, name: t.name })));
    } catch {
      setTariffs([]);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (dispatchOpen && canDispatch) void loadTariffs();
  }, [dispatchOpen, canDispatch, loadTariffs]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Видалити замовлення?')) return;
    try {
      await api.delete(`/orders/${id}`);
      void fetchOrders();
    } catch {
      alert('Помилка видалення замовлення');
    }
  }, [fetchOrders]);

  const submitDispatch = async () => {
    if (!dPhone.trim() || !dFrom.trim() || !dTo.trim()) {
      alert('Телефон та адреси обов’язкові');
      return;
    }
    setDispatchBusy(true);
    try {
      await api.post('/orders/dispatch', {
        clientPhone: dPhone.trim(),
        clientFullName: dName.trim() || undefined,
        pickupAddress: dFrom.trim(),
        dropoffAddress: dTo.trim(),
        ...(dTariff ? { tariffName: dTariff } : {}),
        ...(dNotes.trim() ? { dispatcherNotes: dNotes.trim() } : {}),
        paymentMethod: 'CASH',
      });
      setDispatchOpen(false);
      setDPhone('');
      setDName('');
      setDFrom('');
      setDTo('');
      setDTariff('');
      setDNotes('');
      void fetchOrders();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error ?? 'Помилка');
    } finally {
      setDispatchBusy(false);
    }
  };

  const columns: GridColDef<OrderRow>[] = useMemo(() => {
    const cols: GridColDef<OrderRow>[] = [];
    if (canChat) {
      cols.push(
        buildChatColumn<OrderRow>(
          (row) => row.id,
          (id) => setChatOrderId(id)
        )
      );
    }
    cols.push(
      { field: 'createdAt', headerName: 'Дата', width: 170 },
      { field: 'from', headerName: 'Звідки', flex: 1, minWidth: 200 },
      { field: 'to', headerName: 'Куди', flex: 1, minWidth: 200 },
      { field: 'price', headerName: 'Ціна', width: 110 },
      {
        field: 'status',
        headerName: 'Статус',
        width: 140,
        renderCell: (params) => (
          <Chip
            label={String(params.value)}
            color={statusColor(String(params.value))}
            size="small"
          />
        ),
      },
      { field: 'clientName', headerName: 'Клієнт', flex: 1, minWidth: 160 },
      { field: 'driverName', headerName: 'Водій', flex: 1, minWidth: 160 },
      { field: 'id', headerName: 'UUID', width: 280 }
    );
    if (canDeleteOrders) {
      cols.push(
        buildRowActionsColumn<OrderRow>({
          onDelete: handleDelete,
        })
      );
    }
    return cols;
  }, [canChat, canDeleteOrders, handleDelete]);

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {canDispatch && (
          <Button variant="contained" color="secondary" onClick={() => setDispatchOpen(true)}>
            Телефонне замовлення
          </Button>
        )}
      </Box>

      <AppDataGrid<OrderRow>
        storageKey="orders"
        rows={rows}
        columns={columns}
        loading={loading}
        title="Історія замовлень"
        subtitle="Іконка чату відкриває повну переписку за поїздкою"
        onRefresh={() => void fetchOrders()}
        exportFileName="orders"
      />

      <TripChatDialog
        orderId={chatOrderId}
        open={!!chatOrderId}
        onClose={() => setChatOrderId(null)}
      />

      <Dialog open={dispatchOpen} onClose={() => setDispatchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ручне замовлення (диспетчеризація)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Телефон клієнта" value={dPhone} onChange={(e) => setDPhone(e.target.value)} fullWidth required />
            <TextField label="ПІБ клієнта" value={dName} onChange={(e) => setDName(e.target.value)} fullWidth />
            <TextField label="Звідки" value={dFrom} onChange={(e) => setDFrom(e.target.value)} fullWidth required />
            <TextField label="Куди" value={dTo} onChange={(e) => setDTo(e.target.value)} fullWidth required />
            <TextField select label="Тариф (клас)" value={dTariff} onChange={(e) => setDTariff(e.target.value)} fullWidth>
              <MenuItem value="">За замовчуванням</MenuItem>
              {tariffs.map((t) => (
                <MenuItem key={t.id} value={t.name}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Коментар для водія"
              value={dNotes}
              onChange={(e) => setDNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchOpen(false)}>Скасувати</Button>
          <Button variant="contained" onClick={() => void submitDispatch()} disabled={dispatchBusy}>
            Створити
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
