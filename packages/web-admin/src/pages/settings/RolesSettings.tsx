import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import api from '../../api/axios';
import {
  OFFICE_PERMISSION_KEYS,
  type OfficePermissionKey,
  type PermLevel,
} from '../../config/officePermissions';

type OfficeRoleRow = {
  id: string;
  slug: string;
  displayName: string;
  legacyRole: string;
  isSystem: boolean;
  permissions: Record<string, PermLevel>;
};

const LEGACY_OPTIONS = ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'] as const;

export const RolesSettings = () => {
  const [rows, setRows] = useState<OfficeRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<OfficeRoleRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formLegacy, setFormLegacy] = useState<(typeof LEGACY_OPTIONS)[number]>('DISPATCHER');
  const [formSlug, setFormSlug] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<OfficeRoleRow[]>('/office-roles');
      setRows(res.data);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error ?? 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setFormName('');
    setFormSlug('');
    setFormLegacy('DISPATCHER');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      await api.post('/office-roles', {
        displayName: formName.trim(),
        legacyRole: formLegacy,
        ...(formSlug.trim() ? { slug: formSlug.trim() } : {}),
        permissions: {},
      });
      setCreateOpen(false);
      void load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error ?? 'Помилка');
    }
  };

  const savePermissions = async (row: OfficeRoleRow, next: Record<string, PermLevel>) => {
    try {
      await api.patch(`/office-roles/${row.id}`, { permissions: next });
      void load();
      setEditRow(null);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error ?? 'Помилка');
    }
  };

  const remove = async (row: OfficeRoleRow) => {
    if (!window.confirm(`Видалити роль «${row.displayName}»?`)) return;
    try {
      await api.delete(`/office-roles/${row.id}`);
      void load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      alert(ax.response?.data?.error ?? 'Помилка');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Ролі і доступи
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Системні ролі не можна видаляти. Кастомні ролі успадковують базовий тип (legacy) для JWT; набір
        дозволів зберігається в БД і застосовується після повторного входу користувача.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={openCreate}>
          Нова роль
        </Button>
        <Button variant="outlined" onClick={() => void load()} disabled={loading}>
          Оновити
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Назва</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>База (JWT)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Тип</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.displayName}</TableCell>
                <TableCell>
                  <code>{r.slug}</code>
                </TableCell>
                <TableCell>{r.legacyRole}</TableCell>
                <TableCell>
                  {r.isSystem ? <Chip size="small" label="Системна" color="primary" /> : <Chip size="small" label="Кастомна" />}
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setEditRow(r)}>
                    Дозволи
                  </Button>
                  {!r.isSystem && (
                    <Button size="small" color="error" onClick={() => void remove(r)}>
                      Видалити
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Нова роль</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Назва" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth required />
            <TextField
              label="Slug (необов’язково)"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              fullWidth
              helperText="Латиницею; якщо порожньо — згенерується автоматично"
            />
            <FormControl fullWidth>
              <InputLabel>Базовий тип (legacy)</InputLabel>
              <Select
                label="Базовий тип (legacy)"
                value={formLegacy}
                onChange={(e: SelectChangeEvent) => setFormLegacy(e.target.value as (typeof LEGACY_OPTIONS)[number])}
              >
                {LEGACY_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Скасувати</Button>
          <Button variant="contained" onClick={() => void submitCreate()} disabled={!formName.trim()}>
            Створити
          </Button>
        </DialogActions>
      </Dialog>

      {editRow && (
        <PermissionsEditorDialog row={editRow} onClose={() => setEditRow(null)} onSave={savePermissions} />
      )}
    </Box>
  );
};

function PermissionsEditorDialog({
  row,
  onClose,
  onSave,
}: {
  row: OfficeRoleRow;
  onClose: () => void;
  onSave: (row: OfficeRoleRow, p: Record<string, PermLevel>) => void;
}) {
  const [permState, setPermState] = useState<Record<string, PermLevel>>(() => ({
    ...Object.fromEntries(OFFICE_PERMISSION_KEYS.map((k) => [k, 'none' as PermLevel])),
    ...row.permissions,
  }));

  useEffect(() => {
    setPermState({
      ...Object.fromEntries(OFFICE_PERMISSION_KEYS.map((k) => [k, 'none' as PermLevel])),
      ...row.permissions,
    });
  }, [row]);

  const setKey = (key: OfficePermissionKey, v: PermLevel) => {
    setPermState((s) => ({ ...s, [key]: v }));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Дозволи: {row.displayName}</DialogTitle>
      <DialogContent>
        <Table size="small" sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Ключ</TableCell>
              <TableCell>Рівень</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {OFFICE_PERMISSION_KEYS.map((k) => (
              <TableRow key={k}>
                <TableCell>
                  <code>{k}</code>
                </TableCell>
                <TableCell width={200}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={permState[k] ?? 'none'}
                      onChange={(e) => setKey(k, e.target.value as PermLevel)}
                    >
                      <MenuItem value="none">Немає</MenuItem>
                      <MenuItem value="read">Читання</MenuItem>
                      <MenuItem value="write">Повний</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрити</Button>
        <Button variant="contained" onClick={() => onSave(row, permState as Record<string, PermLevel>)}>
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  );
}
