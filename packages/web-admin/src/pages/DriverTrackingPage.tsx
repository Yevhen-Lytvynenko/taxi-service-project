import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import io from 'socket.io-client';
import api from '../api/axios';
import { getSocketOriginFromEnv } from '../config/apiBase';
import { useDriverLocations } from '../hooks/useDriverLocations';
import { LiveDriversMap } from '../components/map/LiveDriversMap';

const ACTIVE_STATUSES = new Set(['ACCEPTED', 'ARRIVED', 'IN_PROGRESS']);

type OrderApi = {
  id: string;
  status: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverId?: string | null;
};

const getSocketUrl = () => getSocketOriginFromEnv();

export const DriverTrackingPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const drivers = useDriverLocations(driverId ? { onlyDriverId: driverId } : undefined);
  const [label, setLabel] = useState('…');
  const [routePolyline, setRoutePolyline] = useState<Array<[number, number]>>([]);

  const driverPoint = driverId ? drivers[driverId] : undefined;

  const refreshRoute = useCallback(async () => {
    if (!driverId || !driverPoint) {
      setRoutePolyline([]);
      return;
    }
    try {
      const { data } = await api.get<OrderApi[]>(`/orders`, { params: { driverId } });
      const active = data.find((o) => ACTIVE_STATUSES.has(o.status));
      if (!active) {
        setRoutePolyline([]);
        return;
      }
      const toDropoff = active.status === 'IN_PROGRESS';
      const from = toDropoff
        ? { lat: active.pickupLat, lng: active.pickupLng }
        : { lat: driverPoint.lat, lng: driverPoint.lng };
      const to = toDropoff
        ? { lat: active.dropoffLat, lng: active.dropoffLng }
        : { lat: active.pickupLat, lng: active.pickupLng };
      const fromStr = `${from.lat},${from.lng}`;
      const toStr = `${to.lat},${to.lng}`;
      const res = await api.get<{ coordinates?: Array<[number, number]> }>(`/route`, {
        params: { from: fromStr, to: toStr },
      });
      const coords = res.data.coordinates;
      if (Array.isArray(coords) && coords.length > 1) {
        setRoutePolyline(coords.map(([lng, lat]) => [lat, lng] as [number, number]));
      } else {
        setRoutePolyline([]);
      }
    } catch {
      setRoutePolyline([]);
    }
  }, [driverId, driverPoint?.lat, driverPoint?.lng, driverPoint?.updatedAt]);

  useEffect(() => {
    void refreshRoute();
  }, [refreshRoute]);

  useEffect(() => {
    if (!driverId) return;
    const socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socket.emit('admin_connect');
    const onOrder = (order: { driverId?: string | null }) => {
      if (order.driverId === driverId) void refreshRoute();
    };
    socket.on('admin:order-update', onOrder);
    return () => {
      socket.off('admin:order-update', onOrder);
      socket.disconnect();
    };
  }, [driverId, refreshRoute]);

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
        routePolyline={routePolyline}
      />
    </Box>
  );
};
