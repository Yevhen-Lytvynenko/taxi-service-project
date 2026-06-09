import { useCallback, useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildChatColumn } from '../components/organisms/gridActions';
import { TripChatDialog } from '../components/organisms/TripChatDialog';

type ChatHistoryMessage = { role?: string; text?: string };

type ChatRow = {
  id: string;
  orderId?: string;
  history?: ChatHistoryMessage[] | unknown;
  updatedAt?: string;
  order?: {
    id: string;
    status?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
    client?: { fullName?: string; phone?: string };
    driver?: { user?: { fullName?: string; phone?: string } };
  };
};

function previewHistory(history: unknown): string {
  if (!Array.isArray(history)) return '—';
  const parts = history.slice(0, 3).map((m: any) => {
    const who = m?.role === 'DRIVER' ? 'Водій' : m?.role === 'ADMIN' ? 'Адмін' : 'Клієнт';
    const t = typeof m?.text === 'string' ? m.text : '';
    return `${who}: ${t.slice(0, 60)}${t.length > 60 ? '…' : ''}`;
  });
  return parts.join(' · ') || 'порожньо';
}

function messagesCount(history: unknown): number {
  return Array.isArray(history) ? history.length : 0;
}

export const Chats = () => {
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/chats?limit=400');
      setRows(res.data as ChatRow[]);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  const columns: GridColDef<ChatRow>[] = [
    buildChatColumn<ChatRow>(
      (row) => row.order?.id ?? row.orderId ?? null,
      (id) => setChatOrderId(id)
    ),
    {
      field: 'orderId',
      headerName: 'Замовлення',
      width: 130,
      valueGetter: (p: any) => {
        const id: string = p.row?.order?.id ?? p.row?.orderId ?? '';
        return id ? id.slice(0, 8) : '—';
      },
    },
    {
      field: 'orderStatus',
      headerName: 'Статус поїздки',
      width: 150,
      valueGetter: (p: any) => p.row?.order?.status ?? '—',
      renderCell: (params) => (
        <Chip label={String(params.value)} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: 'client',
      headerName: 'Клієнт',
      flex: 1,
      minWidth: 160,
      valueGetter: (p: any) => p.row?.order?.client?.fullName ?? '—',
    },
    {
      field: 'driver',
      headerName: 'Водій',
      flex: 1,
      minWidth: 160,
      valueGetter: (p: any) => p.row?.order?.driver?.user?.fullName ?? '—',
    },
    {
      field: 'route',
      headerName: 'Маршрут',
      flex: 1.2,
      minWidth: 220,
      valueGetter: (p: any) => {
        const o = p.row?.order;
        if (!o) return '—';
        const a = o.pickupAddress?.slice(0, 40) ?? '';
        const b = o.dropoffAddress?.slice(0, 40) ?? '';
        return `${a} → ${b}`;
      },
    },
    {
      field: 'messages',
      headerName: 'Повідомлень',
      width: 130,
      type: 'number',
      valueGetter: (p: any) => messagesCount(p.row?.history),
    },
    {
      field: 'preview',
      headerName: 'Переписка (фрагмент)',
      flex: 2,
      minWidth: 280,
      valueGetter: (p: any) => previewHistory(p.row?.history),
    },
    {
      field: 'updatedAt',
      headerName: 'Оновлено',
      width: 180,
      valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleString() : '—'),
    },
  ];

  return (
    <>
      <AppDataGrid<ChatRow>
        storageKey="chats"
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        title="Чати замовлень"
        subtitle="Один чат на поїздку. Клік на іконку чату відкриває повний бульбашковий інтерфейс переписки."
        onRefresh={() => void fetchChats()}
        exportFileName="chats"
        onRowClick={(p) => {
          const id = (p.row as ChatRow).order?.id ?? (p.row as ChatRow).orderId ?? null;
          if (id) setChatOrderId(id);
        }}
      />
      <TripChatDialog
        orderId={chatOrderId}
        open={!!chatOrderId}
        onClose={() => setChatOrderId(null)}
      />
    </>
  );
};
