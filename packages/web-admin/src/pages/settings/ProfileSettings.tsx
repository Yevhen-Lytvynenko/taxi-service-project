import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../../api/axios';

type MeUser = {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
};

export const ProfileSettings = () => {
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (cancelled) return;
        const u = (data?.user ?? data) as MeUser;
        setMe(u);
        setFullName(u?.fullName ?? '');
        setEmail(u?.email ?? '');
        setPhone(u?.phone ?? '');
      } catch (e) {
        if (!cancelled) setError('Не вдалося завантажити профіль');
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = (me?.fullName?.[0] ?? 'A').toUpperCase();

  return (
    <Box sx={{ width: '100%', maxWidth: 720 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Профіль адміністратора
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Дані облікового запису. Зміна пароля та двофакторна автентифікація будуть доступні у наступних релізах.
      </Typography>

      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Typography color="text.secondary">Завантаження…</Typography>
          ) : (
            <>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'black', width: 56, height: 56, fontWeight: 700 }}>
                  {initial}
                </Avatar>
                <Box>
                  <Typography variant="h6">{me?.fullName ?? 'Адміністратор'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Роль: {me?.role ?? 'ADMIN'}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Stack spacing={2}>
                <TextField
                  label="ПІБ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Телефон"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Button variant="contained" disabled>
                  Зберегти зміни
                </Button>
                <Button variant="outlined" disabled>
                  Змінити пароль
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Форма підключена до `/auth/me`; збереження буде активоване після введення ролей.
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
