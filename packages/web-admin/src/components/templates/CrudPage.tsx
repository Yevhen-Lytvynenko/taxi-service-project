import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../../api/axios';
import { AppDataGrid } from '../organisms/AppDataGrid';
import { buildRowActionsColumn } from '../organisms/gridActions';

/**
 * Тонка обгортка над `AppDataGrid` для сторінок, які ще використовують старий
 * CRUD-шаблон. Нові сторінки варто писати прямо на `AppDataGrid`.
 */
interface CrudPageProps {
  title: string;
  entity: string;
  columns: GridColDef[];
  FormComponent?: React.FC<{
    initialData?: any;
    onClose: () => void;
    onSuccess: () => void;
  }>;
  storageKey?: string;
  subtitle?: string;
}

export const CrudPage: React.FC<CrudPageProps> = ({
  title,
  entity,
  columns,
  FormComponent,
  storageKey,
  subtitle,
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(entity);
      setRows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити запис? Цю дію не можна скасувати.')) return;
    try {
      await api.delete(`${entity}/${id}`);
      void fetchData();
    } catch {
      alert('Помилка видалення');
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
    buildRowActionsColumn<any>({
      onEdit: FormComponent ? handleEdit : undefined,
      onDelete: handleDelete,
    }),
  ];

  return (
    <>
      <AppDataGrid<any>
        storageKey={(storageKey ?? entity.replace(/^\//, '').replace(/\//g, '-')) || 'crud'}
        rows={rows}
        columns={finalColumns}
        loading={loading}
        title={title}
        subtitle={subtitle}
        onCreate={FormComponent ? handleAdd : undefined}
        createLabel="Створити"
        onRefresh={() => void fetchData()}
        exportFileName={title}
      />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>
          {editData ? `Редагування: ${title}` : `Новий запис: ${title}`}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {FormComponent && (
            <FormComponent
              initialData={editData}
              onClose={() => setOpenModal(false)}
              onSuccess={() => {
                setOpenModal(false);
                void fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
