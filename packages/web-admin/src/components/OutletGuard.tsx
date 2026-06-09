import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import {
  firstAccessiblePath,
  getStoredStaffRole,
  roleCanAccessPath,
} from '../config/menuAccess';

/** Доступ до вкладених маршрутів після логіну (роль + токен). */
export function OutletGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const role = getStoredStaffRole();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (!role) {
      navigate('/login', { replace: true });
      return;
    }
    if (!roleCanAccessPath(role, location.pathname)) {
      navigate(firstAccessiblePath(role), { replace: true });
    }
  }, [location.pathname, role, token, navigate]);

  if (!token || !role) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return <Outlet />;
}
