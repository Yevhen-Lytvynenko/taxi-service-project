import { useCallback, useEffect, useState } from 'react';
import { Rating } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildChatColumn } from '../components/organisms/gridActions';
import { TripChatDialog } from '../components/organisms/TripChatDialog';

type ReviewRow = {
  id: string;
  rating?: number;
  comment?: string;
  orderId?: string | null;
  driver?: { user?: { fullName?: string } };
  author?: { fullName?: string };
  createdAt?: string;
};

export const Reviews = () => {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setRows(res.data as ReviewRow[]);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const columns: GridColDef<ReviewRow>[] = [
    buildChatColumn<ReviewRow>(
      (row) => row.orderId ?? null,
      (id) => setChatOrderId(id)
    ),
    {
      field: 'rating',
      headerName: 'Оцінка',
      width: 160,
      type: 'number',
      renderCell: (p: any) => <Rating value={Number(p.value ?? 0)} readOnly size="small" />,
    },
    { field: 'comment', headerName: 'Коментар', flex: 2, minWidth: 260 },
    {
      field: 'driverName',
      headerName: 'Водій',
      flex: 1,
      minWidth: 160,
      valueGetter: (p: any) => p.row?.driver?.user?.fullName ?? '—',
    },
    {
      field: 'authorName',
      headerName: 'Клієнт',
      flex: 1,
      minWidth: 160,
      valueGetter: (p: any) => p.row?.author?.fullName ?? '—',
    },
    {
      field: 'createdAt',
      headerName: 'Дата',
      width: 170,
      valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleString() : '—'),
    },
  ];

  return (
    <>
      <AppDataGrid<ReviewRow>
        storageKey="reviews"
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        title="Відгуки та рейтинг"
        subtitle="Іконка чату відкриває переписку по відповідній поїздці"
        onRefresh={() => void fetchReviews()}
        exportFileName="reviews"
      />
      <TripChatDialog
        orderId={chatOrderId}
        open={!!chatOrderId}
        onClose={() => setChatOrderId(null)}
      />
    </>
  );
};
