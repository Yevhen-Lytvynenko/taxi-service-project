import {type  GridColDef } from '@mui/x-data-grid';
import { CrudPage } from '../components/templates/CrudPage';
import { Chip } from '@mui/material';

const columns: GridColDef[] = [
  { field: 'amount', headerName: 'Сума', flex: 1, renderCell: (p) => `${p.value} грн` },
  { 
    field: 'type', 
    headerName: 'Тип', 
    flex: 1,
    renderCell: (p) => <Chip label={p.value} color={p.value === 'DEPOSIT' ? 'success' : 'error'} variant="outlined" />
  },
  { field: 'status', headerName: 'Статус', flex: 1 },
  { field: 'driver', headerName: 'Водій', flex: 1, valueGetter: (p: any) => p.row?.driver?.user?.fullName || '-' },
  { field: 'createdAt', headerName: 'Дата', flex: 1, valueFormatter: (p: any) => new Date(p.value).toLocaleString() },
];

export const Transactions = () => (
  <CrudPage title="Фінанси" entity="/transactions" columns={columns} />
);