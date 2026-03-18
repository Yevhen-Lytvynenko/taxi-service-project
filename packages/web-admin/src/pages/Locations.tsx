import { type GridColDef } from '@mui/x-data-grid';
import { CrudPage } from '../components/templates/CrudPage';

const columns: GridColDef[] = [
  { field: 'driverId', headerName: 'ID Водія', flex: 1 },
  { field: 'lat', headerName: 'Широта', flex: 1 },
  { field: 'lng', headerName: 'Довгота', flex: 1 },
  { 
    field: 'timestamp', 
    headerName: 'Час фіксації', 
    flex: 1, 
    // ДОДАНО: : any
    valueFormatter: (params: any) => new Date(params.value).toLocaleString() 
  },
];

export const Locations = () => (
  <CrudPage title="GPS Логи" entity="/locations/history" columns={columns} />
);