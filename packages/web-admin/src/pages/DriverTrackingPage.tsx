import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/axios';
import { useDriverLocations } from '../hooks/useDriverLocations';
import { LiveDriversMap } from '../components/map/LiveDriversMap';

export const DriverTrackingPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const drivers = useDriverLocations(driverId ? { onlyDriverId: driverId } : undefined);
  const [label, setLabel] = useState('…');

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get<{ user?: { fullName?: string } }>(`/drivers/${driverId}`);
        if (!cancelled) {
          setLabel(d?.user?.fullName ?? driverId);
        }
      } catch {
        if (!cancelled) setLabel(driverId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [driverId]);

  if (!driverId) {
    return (
      <Box>
        <Typography>Не вказано водія</Typography>
        <Button component={RouterLink} to="/drivers">
          До списку водіїв
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        component={RouterLink}
        to="/drivers"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 1 }}
      >
        Водії
      </Button>
      <LiveDriversMap
        drivers={drivers}
        subtitle={`Стежування: ${label} · лише цей водій (онлайн-оновлення)`}
        followSingleDriver
      />
    </Box>
  );
};
