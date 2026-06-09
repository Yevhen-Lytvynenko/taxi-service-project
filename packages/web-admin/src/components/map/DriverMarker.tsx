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
    popupAnchor: [0, -16],
  });
}

export const DriverMarker: React.FC<{ driver: DriverWithDisplay; smooth?: boolean }> = ({
  driver,
  smooth = false,
}) => {
  const icon = React.useMemo(
    () => createTaxiIcon(driver.displayHeading),
    [driver.displayHeading]
  );

  const targetRef = React.useRef({ lat: driver.displayLat, lng: driver.displayLng });
  const [pos, setPos] = React.useState(() => ({
    lat: driver.displayLat,
    lng: driver.displayLng,
  }));

  React.useEffect(() => {
    targetRef.current = { lat: driver.displayLat, lng: driver.displayLng };
    if (!smooth) {
      setPos({ lat: driver.displayLat, lng: driver.displayLng });
    }
  }, [driver.displayLat, driver.displayLng, smooth]);

  React.useEffect(() => {
    if (!smooth) return;
    let id: number;
    const tick = () => {
      setPos((cur) => {
        const t = targetRef.current;
        const dLat = t.lat - cur.lat;
        const dLng = t.lng - cur.lng;
        if (Math.abs(dLat) < 1e-7 && Math.abs(dLng) < 1e-7) {
          return cur.lat === t.lat && cur.lng === t.lng ? cur : { ...t };
        }
        return { lat: cur.lat + dLat * 0.38, lng: cur.lng + dLng * 0.38 };
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [smooth]);

  return (
    <Marker position={[pos.lat, pos.lng]} icon={icon} key={driver.driverId}>
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
