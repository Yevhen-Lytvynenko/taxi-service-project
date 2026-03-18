import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import type { HeatmapPoint } from '../types/map.types';

export type HeatmapType = 'pickup' | 'dropoff' | 'both';

export function useHeatmapData(
  from: Date | null,
  to: Date | null,
  type: HeatmapType
) {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHeatmap = useCallback(async () => {
    if (!from || !to) {
      setPoints([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        type
      });
      const res = await api.get(`/locations/heatmap?${params}`);
      setPoints(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [from?.toISOString(), to?.toISOString(), type]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  return { points, loading, refetch: fetchHeatmap };
}
