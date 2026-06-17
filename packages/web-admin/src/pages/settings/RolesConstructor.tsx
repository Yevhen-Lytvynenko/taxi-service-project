import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import api from '../../api/axios';
import {
  OFFICE_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS_UK,
  type OfficePermissionKey,
  type PermLevel,
} from '../../config/officePermissions';
import { previewMenuForPermissions } from '../../config/menuAccess';

type OfficeRoleRow = {
  id: string;
  slug: string;
  displayName: string;
  legacyRole: string;
  isSystem: boolean;
  permissions: Record<string, PermLevel>;
};

type UserRow = { id: string; officeRoleId?: string | null; role: string };

const LEGACY_OPTIONS = ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'] as const;

function emptyPermState(): Record<OfficePermissionKey, PermLevel> {
  return Object.fromEntries(OFFICE_PERMISSION_KEYS.map((k) => [k, 'none' as PermLevel])) as Record<
    OfficePermissionKey,
    PermLevel
  >;
}

function mergePermState(row: OfficeRoleRow): Record<OfficePermissionKey, PermLevel> {
  return { ...emptyPermState(), ...row.permissions };
}

export const RolesConstructor = () => {
  const [rows, setRows] = useState<OfficeRoleRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [permDraft, setPermDraft] = useState<Record<OfficePermissionKey, PermLevel>>(emptyPermState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLegacy, setFormLegacy] = useState<(typeof LEGACY_OPTIONS)[number]>('DISPATCHER');
  const [formSlug, setFormSlug] = useState('');
  const [cloneFromId, setCloneFromId] = useState('');

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const userCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of users) {
      if (u.officeRoleId) m.set(u.officeRoleId, (m.get(u.officeRoleId) ?? 0) + 1);
    }
    return m;
  }, [users]);

  const menuPreview = useMemo(() => {
    if (!selected) return [];
    return previewMenuForPermissions(selected.legacyRole, permDraft);
  }, [selected, permDraft]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        api.get<OfficeRoleRow[]>('/office-roles'),
        api.get<UserRow[]>('/users'),
      ]);
      setRows(rolesRes.data);
      setUsers(usersRes.data.filter((u) => LEGACY_OPTIONS.includes(u.role as (typeof LEGACY_OPTIONS)[number])));
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

  useEffect(() => {
    if (rows.length === 0) return;
    if (!selectedId || !rows.some((r) => r.id === selectedId)) {
      setSelectedId(rows[0]!.id);
    }
  }, [rows, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setDisplayNameDraft(selected.displayName);
    setPermDraft(mergePermState(selected));
    setCloneFromId('');
  }, [selected?.id]);

  const selectRole = (id: string) => setSelectedId(id);

  const setPerm = (key: OfficePermissionKey, level: PermLevel) => {
    setPermDraft((s) => ({ ...s, [key]: level }));
  };

  const handleClone = (fromId: string) => {
    const src = rows.find((r) => r.id === fromId);
    if (!src) return;
    setPermDraft(mergePermState(src));
    setSnack(`Скопійовано дозволи з «${src.displayName}»`);
  };

  const saveRole = async () => {
    if (!selected) return;
    if (!displayNameDraft.trim()) {
      setSnack('Вкажіть назву ролі');
      return;
    }
    try {
      await api.patch(`/office-roles/${selected.id}`, {
        displayName: displayNameDraft.trim(),
        permissions: permDraft,
      });
      setSnack('Збережено. Зміни застосуються після повторного входу користувача.');
      void load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      setSnack(ax.response?.data?.error ?? 'Помилка збереження');
    }
  };

  const submitCreate = async () => {
    if (!formName.trim()) return;
    try {
      const res = await api.post<OfficeRoleRow>('/office-roles', {
        displayName: formName.trim(),
        legacyRole: formLegacy,
        ...(formSlug.trim() ? { slug: formSlug.trim() } : {}),
        permissions: {},
      });
      setCreateOpen(false);
      setSelectedId(res.data.id);
      setSnack('Роль створено');
      void load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      setSnack(ax.response?.data?.error ?? 'Помилка створення');
    }
  };

  const remove = async (row: OfficeRoleRow) => {
    if (!window.confirm(`Видалити роль «${row.displayName}»?`)) return;
    try {
      await api.delete(`/office-roles/${row.id}`);
      if (selectedId === row.id) setSelectedId(null);
      setSnack('Роль видалено');
      void load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { error?: string } } };
      setSnack(ax.response?.data?.error ?? 'Помилка видалення');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Конструктор ролей
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Налаштуйте доступ до розділів адмін-панелі. Зміни застосуються після повторного входу користувача.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Нова роль
        </Button>
        <Button variant="outlined" onClick={() => void load()} disabled={loading}>
          Оновити
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Ролі
          </Typography>
          <Stack spacing={1}>
            {rows.map((r) => (
              <Card
                key={r.id}
                variant="outlined"
                sx={{
                  borderColor: r.id === selectedId ? 'primary.main' : 'divider',
                  borderWidth: r.id === selectedId ? 2 : 1,
                }}
              >
                <CardActionArea onClick={() => selectRole(r.id)}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography fontWeight={600}>{r.displayName}</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      <Chip size="small" label={r.legacyRole} variant="outlined" />
                      {r.isSystem && <Chip size="small" label="системна" color="primary" />}
                      <Chip size="small" label={`${userCounts.get(r.id) ?? 0} корист.`} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          {selected ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Редактор ролі
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Назва для відображення"
                  value={displayNameDraft}
                  onChange={(e) => setDisplayNameDraft(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField label="Slug" value={selected.slug} fullWidth size="small" disabled />
                <TextField label="Базовий тип (JWT)" value={selected.legacyRole} fullWidth size="small" disabled />
                <FormControl fullWidth size="small">
                  <InputLabel>Скопіювати з ролі…</InputLabel>
                  <Select
                    label="Скопіювати з ролі…"
                    value={cloneFromId}
                    onChange={(e: SelectChangeEvent) => {
                      const id = e.target.value;
                      setCloneFromId(id);
                      if (id) handleClone(id);
                    }}
                  >
                    <MenuItem value="">—</MenuItem>
                    {rows
                      .filter((r) => r.id !== selected.id)
                      .map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.displayName}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={() => void saveRole()}>
                    Зберегти
                  </Button>
                  {!selected.isSystem && (
                    <Button color="error" onClick={() => void remove(selected)}>
                      Видалити
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Превʼю меню
              </Typography>
              <List dense disablePadding>
                {menuPreview.length === 0 ? (
                  <ListItem disableGutters>
                    <ListItemText secondary="Немає доступних пунктів меню" />
                  </ListItem>
                ) : (
                  menuPreview.map((item) => (
                    <ListItem key={item.path} disableGutters sx={{ py: 0 }}>
                      <ListItemText primary={item.text} secondary={item.path} />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography color="text.secondary">Оберіть роль зі списку</Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          {selected && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Матриця доступу
              </Typography>
              <Stack spacing={2}>
                {PERMISSION_GROUPS.map((group) => (
                  <Box key={group.title}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {group.title}
                    </Typography>
                    <Stack spacing={1.5}>
                      {group.keys.map((key) => (
                        <Box key={key}>
                          <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend" sx={{ fontSize: 13, mb: 0.5 }}>
                              {PERMISSION_LABELS_UK[key]}
                            </FormLabel>
                            <RadioGroup
                              row
                              value={permDraft[key] ?? 'none'}
                              onChange={(e) => setPerm(key, e.target.value as PermLevel)}
                            >
                              <FormControlLabel value="none" control={<Radio size="small" />} label="Немає" />
                              <FormControlLabel value="read" control={<Radio size="small" />} label="Перегляд" />
                              <FormControlLabel value="write" control={<Radio size="small" />} label="Повний" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Нова роль</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Назва"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              required
            />
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
                onChange={(e: SelectChangeEvent) =>
                  setFormLegacy(e.target.value as (typeof LEGACY_OPTIONS)[number])
                }
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

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};
