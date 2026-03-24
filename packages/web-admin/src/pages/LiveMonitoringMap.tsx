import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { MapContainer, TileLayer, LayerGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { OSM_TILE_URL, OSM_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM } from '../components/map/mapConfig';
import { DriverMarker } from '../components/map/DriverMarker';
import { useDriverLocations } from '../hooks/useDriverLocations';

/** Flex-контейнер дає height пізніше за mount Leaflet — без цього частина тайлів сіра */
function InvalidateOnResize() {
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

export const LiveMonitoringMap: React.FC = () => {
  const drivers = useDriverLocations();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary' }}>
        Мапа в реальному часі (OpenStreetMap)
      </Typography>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <InvalidateOnResize />
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} maxZoom={19} />
          <LayerGroup>
            {Object.values(drivers).map((driver) => (
              <DriverMarker key={driver.driverId} driver={driver} />
            ))}
          </LayerGroup>
        </MapContainer>
      </Box>
    </Box>
  );
};
