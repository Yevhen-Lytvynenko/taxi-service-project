import { useEffect, useState } from 'react';
import { getStoredStaffRole, postLoginDefaultPath } from '../config/menuAccess';
import { TextField, Button, Box, Typography, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { BrandLogo } from '../components/BrandLogo';
import { BrandWatermark } from '../components/BrandWatermark';
type JwtPermPayload = {
  perms?: Record<string, 'none' | 'read' | 'write'>;
};

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = getStoredStaffRole();
    if (token && role) {
      navigate(postLoginDefaultPath(role), { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      const token = res.data.token as string;
      const decoded = jwtDecode<JwtPermPayload>(token);
      const userWithPerms = { ...res.data.user, perms: decoded.perms };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithPerms));
      const role = res.data.user?.role as string | undefined;
      navigate(postLoginDefaultPath(role));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setError(msg || 'Невірний логін або пароль');
      console.error('[Login]', msg);
    }
  };

  return (
    <BrandWatermark variant="center" sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Paper elevation={3} sx={{ p: 4, width: 400, maxWidth: 'calc(100% - 32px)' }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <BrandLogo size={48} />
          </Box>
          <Typography variant="h5" mb={3} textAlign="center">
            Вхід в систему
          </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField 
            fullWidth label="Логін" margin="normal" 
            value={username} onChange={e => setUsername(e.target.value)} 
          />
          <TextField 
            fullWidth label="Пароль" type="password" margin="normal" 
            value={password} onChange={e => setPassword(e.target.value)} 
          />
          <Button fullWidth variant="contained" size="large" type="submit" sx={{ mt: 3 }}>
            Увійти
          </Button>
        </form>
        </Paper>
      </Box>
    </BrandWatermark>
  );
};