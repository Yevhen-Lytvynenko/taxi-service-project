import { type GridColDef } from '@mui/x-data-grid';
import { CrudPage } from '../components/templates/CrudPage';
import { Rating } from '@mui/material';

const columns: GridColDef[] = [
  { 
    field: 'rating', 
    headerName: 'Оцінка', 
    width: 150, 
    // ДОДАНО: : any
    renderCell: (params: any) => <Rating value={Number(params.value)} readOnly /> 
  },
  { field: 'comment', headerName: 'Коментар', flex: 2 },
  { 
    field: 'driver', 
    headerName: 'Водій', 
    flex: 1, 
    // ДОДАНО: : any
    valueGetter: (params: any) => params.row?.driver?.user?.fullName 
  },
  { 
    field: 'author', 
    headerName: 'Клієнт', 
    flex: 1, 
    // ДОДАНО: : any
    valueGetter: (params: any) => params.row?.author?.fullName 
  },
];

export const Reviews = () => (
  <CrudPage title="Відгуки та Рейтинг" entity="/reviews" columns={columns} />
);