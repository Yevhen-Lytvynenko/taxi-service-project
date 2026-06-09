import { useCallback, useEffect, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';

type EmployeeRow = {
  id: string;
  department?: string;
  salary?: number;
  user?: { fullName?: string; phone?: string };
};

export const Employees = () => {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setRows(res.data as EmployeeRow[]);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  const columns: GridColDef<EmployeeRow>[] = [
    {
      field: 'fullName',
      headerName: 'ПІБ',
      flex: 1,
      minWidth: 180,
      valueGetter: (p: any) => p.row?.user?.fullName ?? 'N/A',
    },
    {
      field: 'phone',
      headerName: 'Телефон',
      flex: 1,
      minWidth: 140,
      valueGetter: (p: any) => p.row?.user?.phone ?? '—',
    },
    { field: 'department', headerName: 'Відділ', flex: 1, minWidth: 140 },
    { field: 'salary', headerName: 'Зарплата', width: 130, type: 'number' },
  ];

  return (
    <AppDataGrid<EmployeeRow>
      storageKey="employees"
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={(r) => r.id}
      title="Співробітники"
      onRefresh={() => void fetchEmployees()}
      exportFileName="employees"
    />
  );
};
