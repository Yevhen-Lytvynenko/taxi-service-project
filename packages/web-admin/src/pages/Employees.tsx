import { type GridColDef } from '@mui/x-data-grid';
import { CrudPage } from '../components/templates/CrudPage';

// Тут можна додати форму, але поки зробимо перегляд
const columns: GridColDef[] = [
  { field: 'department', headerName: 'Відділ', flex: 1 },
  { field: 'salary', headerName: 'Зарплата', flex: 1 },
  { field: 'user', headerName: 'ПІБ', flex: 1, valueGetter: (params: any) => params.row?.user?.fullName || 'N/A' },
  { field: 'userPhone', headerName: 'Телефон', flex: 1, valueGetter: (params: any) => params.row?.user?.phone },
];

export const Employees = () => (
  <CrudPage title="Співробітники" entity="/employees" columns={columns} />
);