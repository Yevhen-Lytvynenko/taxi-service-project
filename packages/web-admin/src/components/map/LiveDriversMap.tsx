import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { MapContainer, TileLayer, LayerGroup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { OSM_TILE_URL, OSM_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM } from './mapConfig';
import { DriverMarker } from './DriverMarker';
import type { Driver } from '../../types/map.types';

type DriverWithDisplay = Driver & {
  displayLat: number;
  displayLng: number;
  displayHeading: number;
};

/** Flex-контейнер дає height пізніше за mount Leaflet — без цього частина тайлів сіра */
export function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };
    const t1 = setTimeout(invalidate, 50);
    const t2 = setTimeout(invalidate, 400);
    window.addEventListener('resize', invalidate);
    const parent = map.getContainer().parentElement;
    const ro = parent ? new ResizeObserver(invalidate) : null;
    if (parent) ro!.observe(parent);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', invalidate);
      ro?.disconnect();
    };
  }, [map]);
  return null;
}

function MapFollowLatestDriver({
  drivers,
  enabled,
}: {
  drivers: DriverWithDisplay[];
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || drivers.length !== 1) return;
    const d = drivers[0]!;
    map.setView([d.displayLat, d.displayLng], Math.max(map.getZoom(), 15), { animate: true });
  }, [enabled, drivers, map]);
  return null;
}

interface LiveDriversMapProps {
  drivers: Record<string, DriverWithDisplay>;
  subtitle: string;
  /** Центрувати та наближати при оновленні позиції одного водія */
  followSingleDriver?: boolean;
  /** Плавна інтерполяція маркера (рекомендовано лише для одного водія — менше onRender) */
  smoothMarkers?: boolean;
  /** Маршрут [lat, lng][] поверх карти (напр. активне замовлення) */
  routePolyline?: Array<[number, number]>;
}

export function LiveDriversMap({
  drivers,
  subtitle,
  followSingleDriver,
  smoothMarkers,
  routePolyline,
}: LiveDriversMapProps) {
  const list = Object.values(drivers) as DriverWithDisplay[];
  const doSmooth = smoothMarkers ?? !!followSingleDriver;
  const line = routePolyline && routePolyline.length > 1 ? routePolyline : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary' }}>
        {subtitle}
      </Typography>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <InvalidateOnResize />
          {followSingleDriver && <MapFollowLatestDriver drivers={list} enabled />}
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} maxZoom={19} />
          <LayerGroup>
            {line && (
              <Polyline
                positions={line}
                pathOptions={{ color: '#ffd451', weight: 5, opacity: 0.88 }}
              />
            )}
            {list.map((driver) => (
              <DriverMarker key={driver.driverId} driver={driver} smooth={doSmooth} />
            ))}
          </LayerGroup>
        </MapContainer>
      </Box>
    </Box>
  );
}
