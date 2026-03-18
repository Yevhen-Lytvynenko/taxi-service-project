import React, { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { MapContainer, TileLayer, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L;
}
import 'leaflet.heat';

import { OSM_TILE_URL, OSM_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM } from '../components/map/mapConfig';
import { DriverMarker } from '../components/map/DriverMarker';
import { HeatmapLayer } from '../components/map/HeatmapLayer';
import { useDriverLocations } from '../hooks/useDriverLocations';
import { useHeatmapData } from '../hooks/useHeatmapData';
import type { HeatmapType } from '../hooks/useHeatmapData';

const defaultFrom = new Date();
defaultFrom.setDate(defaultFrom.getDate() - 7);
const defaultTo = new Date();

export const LiveMonitoringMap: React.FC = () => {
  const drivers = useDriverLocations();
  const [heatmapFrom, setHeatmapFrom] = useState<Date>(defaultFrom);
  const [heatmapTo, setHeatmapTo] = useState<Date>(defaultTo);
  const [heatmapType, setHeatmapType] = useState<HeatmapType>('both');

  const { points } = useHeatmapData(heatmapFrom, heatmapTo, heatmapType);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Тип теплокарти</InputLabel>
          <Select
            value={heatmapType}
            label="Тип теплокарти"
            onChange={(e) => setHeatmapType(e.target.value as HeatmapType)}
          >
            <MenuItem value="pickup">Підбор</MenuItem>
            <MenuItem value="dropoff">Висадка</MenuItem>
            <MenuItem value="both">Обидва</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="З"
          type="date"
          value={heatmapFrom.toISOString().slice(0, 10)}
          onChange={(e) => setHeatmapFrom(new Date(e.target.value))}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <TextField
          size="small"
          label="По"
          type="date"
          value={heatmapTo.toISOString().slice(0, 10)}
          onChange={(e) => setHeatmapTo(new Date(e.target.value))}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
          <HeatmapLayer points={points} radius={25} blur={15} />
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
