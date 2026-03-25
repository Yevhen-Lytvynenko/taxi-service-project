import React from 'react';
import { useDriverLocations } from '../hooks/useDriverLocations';
import { LiveDriversMap } from '../components/map/LiveDriversMap';

export const LiveMonitoringMap: React.FC = () => {
  const drivers = useDriverLocations();

  return (
    <LiveDriversMap
      drivers={drivers}
      subtitle="Мапа в реальному часі — усі водії (OpenStreetMap)"
    />
  );
};
