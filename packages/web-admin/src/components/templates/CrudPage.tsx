import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, IconButton, Dialog, DialogTitle, 
  DialogContent 
} from '@mui/material';
import { DataGrid, type GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Add, Delete, Edit } from '@mui/icons-material';
import api from '../../api/axios';


interface CrudPageProps {
  title: string;       
  entity: string;      
  columns: GridColDef[]; 
  FormComponent?: React.FC<{ initialData?: any; onClose: () => void; onSuccess: () => void }>; 
}

export const CrudPage: React.FC<CrudPageProps> = ({ title, entity, columns, FormComponent }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(entity);
      setRows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [entity]);

  const handleDelete = async (id: string) => {
    if (confirm('Видалити запис? Цю дію не можна скасувати.')) {
      try {
        await api.delete(`${entity}/${id}`);
        fetchData();
      } catch (e) {
        alert('Помилка видалення');
      }
    }
  };

  const handleEdit = (row: any) => {
    setEditData(row);
    setOpenModal(true);
  };

  const handleAdd = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const finalColumns: GridColDef[] = [
    ...columns,
    {
      field: 'actions',
      headerName: '',
      width: 120,
      renderCell: (params) => (
        <Box>
          {FormComponent && (
            <IconButton color="primary" onClick={() => handleEdit(params.row)}><Edit /></IconButton>
          )}
          <IconButton color="error" onClick={() => handleDelete(params.id as string)}><Delete /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary">{title}</Typography>
        {FormComponent && (
          <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
            Створити
          </Button>
        )}
      </Box>

      <Paper sx={{ height: '75vh', width: '100%', p: 1 }}>
        <DataGrid
          rows={rows}
          columns={finalColumns}
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            loadingOverlay: {},
          }}
        />
      </Paper>
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>
            {editData ? `Редагування: ${title}` : `Новий запис: ${title}`}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {FormComponent && (
            <FormComponent 
              initialData={editData} 
              onClose={() => setOpenModal(false)} 
              onSuccess={() => { setOpenModal(false); fetchData(); }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};