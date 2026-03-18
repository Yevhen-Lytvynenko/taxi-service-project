import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Driver } from '../../types/map.types';

interface DriverWithDisplay extends Driver {
  displayLat: number;
  displayLng: number;
  displayHeading: number;
}

function createTaxiIcon(heading: number): L.DivIcon {
  return L.divIcon({
    className: 'driver-marker-icon',
    html: `<div style="
      width: 32px; height: 32px;
      background: url('/taxi.png') center/contain no-repeat;
      transform: rotate(${heading}deg);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

export const DriverMarker: React.FC<{ driver: DriverWithDisplay }> = ({ driver }) => {
  const icon = React.useMemo(
    () => createTaxiIcon(driver.displayHeading),
    [driver.displayHeading]
  );

  return (
    <Marker
      position={[driver.displayLat, driver.displayLng]}
      icon={icon}
      key={driver.driverId}
    >
      <Popup>
        <div>
          <strong>{driver.name}</strong>
          <br />
          Status: {driver.status}
          <br />
          Car: {driver.carModel}
        </div>
      </Popup>
    </Marker>
  );
};
