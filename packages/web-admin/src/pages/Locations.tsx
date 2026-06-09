import { useCallback, useEffect, useState } from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AppDataGrid } from '../components/organisms/AppDataGrid';
import { buildGpsColumn } from '../components/organisms/gridActions';

type LocationRow = {
  id: string;
  orderId?: string | null;
  driver?: { id?: string; user?: { fullName?: string } };
  lat: number;
  lng: number;
  speed?: number | null;
  timestamp: string;
};

export const Locations = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations/recent?limit=3000');
      setRows(res.data as LocationRow[]);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const columns: GridColDef<LocationRow>[] = [
    buildGpsColumn<LocationRow>((row) => row.driver?.id, navigate),
    {
      field: 'driverName',
      headerName: 'Водій',
      flex: 1,
      minWidth: 160,
      valueGetter: (p: any) => p.row?.driver?.user?.fullName ?? '—',
    },
    {
      field: 'orderId',
      headerName: 'Замовлення',
      width: 280,
      valueGetter: (p: any) => p.row?.orderId ?? '—',
    },
    { field: 'lat', headerName: 'Широта', width: 120, type: 'number' },
    { field: 'lng', headerName: 'Довгота', width: 120, type: 'number' },
    {
      field: 'speed',
      headerName: 'Швидк. км/год',
      width: 130,
      type: 'number',
      valueFormatter: (p: any) => (p.value != null ? String(Math.round(p.value)) : '—'),
    },
    {
      field: 'timestamp',
      headerName: 'Час',
      flex: 1,
      minWidth: 180,
      valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleString() : '—'),
    },
  ];

  return (
    <AppDataGrid<LocationRow>
      storageKey="locations"
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={(r) => r.id}
      title="GPS логи"
      subtitle="Останні трек-пункти; клік на іконку GPS відкриває сторінку стежування за водієм"
      onRefresh={() => void fetchLocations()}
      exportFileName="gps-logs"
    />
  );
};
