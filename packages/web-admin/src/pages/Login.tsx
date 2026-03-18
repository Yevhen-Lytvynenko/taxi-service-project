import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setError(msg || 'Невірний логін або пароль');
      console.error('[Login]', msg);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" mb={3} textAlign="center">Вхід в систему</Typography>
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
  );
};