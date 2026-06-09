import { useMemo } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { OSM_TILE_URL, OSM_ATTRIBUTION } from '../../components/map/mapConfig';
import { InvalidateOnResize } from '../../components/map/LiveDriversMap';
import { STRUM_HQ, STRUM_HQ_ADDRESS_LINE } from './officeLocation';

function createOfficeIcon(): L.DivIcon {
  return L.divIcon({
    className: 'strum-office-marker',
    html: `<div style="
      width: 36px; height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: #ffd451;
      border: 3px solid #1a1a1a;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "><div style="
      transform: rotate(45deg);
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; color: #1a1a1a;
    ">S</div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

type OfficeMapProps = {
  sx?: SxProps<Theme>;
};

/** Інтерактивна карта OSM з маркером головного офісу Strum в Одесі. */
export function OfficeMap({ sx }: OfficeMapProps) {
  const icon = useMemo(() => createOfficeIcon(), []);
  const [lat, lng] = STRUM_HQ.position;

  return (
    <Box
      sx={{
        width: '100%',
        height: { xs: 280, md: 340 },
        ...sx,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.700',
        '& .leaflet-container': { height: '100%', width: '100%', font: 'inherit' },
        '& .leaflet-popup-content-wrapper': { borderRadius: 1 },
      }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={STRUM_HQ.zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <InvalidateOnResize />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            <strong>{STRUM_HQ.title}</strong>
            <br />
            {STRUM_HQ_ADDRESS_LINE}
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
}
