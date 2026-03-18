import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { HeatmapPoint } from '../../types/map.types';

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number?][],
    options?: { radius?: number; blur?: number; maxZoom?: number }
  ): L.Layer;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 18
}) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (typeof L.heatLayer !== 'function') return;

    const latlngs: [number, number, number][] = points.map((p) => [
      p.latitude,
      p.longitude,
      p.weight
    ]);

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    if (latlngs.length > 0) {
      layerRef.current = L.heatLayer(latlngs, { radius, blur, maxZoom });
      map.addLayer(layerRef.current);
    } else {
      layerRef.current = null;
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, radius, blur, maxZoom]);

  return null;
};
