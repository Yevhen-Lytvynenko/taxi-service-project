import { useCallback, useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';

type TransactionRow = {
  id: string;
  amount: number;
  type: string;
  orderId?: string | null;
  order?: { id?: string };
  driver?: { user?: { fullName?: string } };
  createdAt: string;
};

function typeColor(t: string): 'success' | 'warning' | 'default' | 'info' {
  if (t === 'ORDER_EARNING') return 'success';
  if (t === 'DEPOSIT') return 'info';
  return 'default';
}

export const Transactions = () => {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      setRows(res.data as TransactionRow[]);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const columns: GridColDef<TransactionRow>[] = [
    {
      field: 'amount',
      headerName: 'Сума',
      width: 120,
      type: 'number',
      valueFormatter: (p: any) => `${p.value} ₴`,
    },
    {
      field: 'type',
      headerName: 'Тип',
      width: 180,
      renderCell: (p) => (
        <Chip
          label={String(p.value)}
          color={typeColor(String(p.value))}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'orderRef',
      headerName: 'Замовлення',
      flex: 1,
      minWidth: 220,
      valueGetter: (p: any) => p.row?.orderId ?? p.row?.order?.id ?? '—',
    },
    {
      field: 'driver',
      headerName: 'Водій',
      flex: 1,
      minWidth: 160,
      valueGetter: (p: any) => p.row?.driver?.user?.fullName ?? '—',
    },
    {
      field: 'createdAt',
      headerName: 'Дата',
      width: 180,
      valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleString() : '—'),
    },
  ];

  return (
    <AppDataGrid<TransactionRow>
      storageKey="transactions"
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={(r) => r.id}
      title="Фінанси (транзакції)"
      subtitle="Виплати за поїздки пов'язані з замовленнями; депозити без orderId — додатковий демо-набір"
      onRefresh={() => void fetchTransactions()}
      exportFileName="transactions"
    />
  );
};
