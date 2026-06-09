import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/route.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/route.service')>();
  return {
    ...actual,
    getRoute: vi.fn(),
    getRouteAlternativesFromOsrm: vi.fn().mockResolvedValue([]),
    getRouteWithViaWaypoint: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('../src/services/trafficAnalytics.service', () => ({
  analyzeAndRankRoutes: vi.fn().mockImplementation(async (options: any[]) => {
    if (!options || options.length === 0) {
      return { options: [], recommendedIndex: 0, analyses: [] };
    }
    const scored = options
      .map((o: any, i: number) => ({ ...o, _origIdx: i }))
      .sort((a: any, b: any) => a.durationInTrafficSeconds - b.durationInTrafficSeconds);
    scored.forEach((o: any, idx: number) => {
      o.id = String(idx);
      o.label = idx === 0 ? 'Рекомендовано (90/100)' : `Варіант ${idx + 1} (70/100)`;
      o.pros = [`~${Math.round(o.durationInTrafficSeconds / 60)} хв`];
      o.cons = [];
    });
    return {
      options: scored,
      recommendedIndex: 0,
      analyses: scored.map(() => ({ score: 90, adjustedDurationSec: 300, congestionLevel: 'low', avgSpeedKmh: 35, busyDriversInCorridor: 0, timePeriod: 'ніч', insights: [] })),
    };
  }),
}));

import {
  decodeEncodedPolyline,
  enrichRouteOptions,
  getDrivingRouteAlternatives,
} from '../src/services/googleDirections.service';
import { getRoute } from '../src/services/route.service';

const SAMPLE_POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
/** Інша геометрія (з відхиленням від прямої), щоб не зливати варіанти як дублікати. */
const SAMPLE_POLYLINE_ALT = '_cuzG__ozDg^f^g^w|A';

describe('decodeEncodedPolyline', () => {
  it('повертає принаймні дві точки у форматі [lng, lat]', () => {
    const coords = decodeEncodedPolyline(SAMPLE_POLYLINE);
    expect(coords.length).toBeGreaterThanOrEqual(2);
    for (const p of coords) {
      expect(p.length).toBe(2);
      expect(typeof p[0]).toBe('number');
      expect(typeof p[1]).toBe('number');
    }
  });
});

describe('enrichRouteOptions', () => {
  it('додає label, pros і cons', () => {
    const options = [
      {
        id: '0',
        durationSeconds: 300,
        durationInTrafficSeconds: 300,
        distanceMeters: 4000,
        summary: 'Via A',
        coordinates: [
          [30.72, 46.48],
          [30.73, 46.49],
        ] as Array<[number, number]>,
        label: '',
        pros: [],
        cons: [],
      },
      {
        id: '1',
        durationSeconds: 600,
        durationInTrafficSeconds: 600,
        distanceMeters: 3500,
        summary: 'Via B',
        coordinates: [
          [30.72, 46.48],
          [30.73, 46.49],
        ] as Array<[number, number]>,
        label: '',
        pros: [],
        cons: [],
      },
    ];
    enrichRouteOptions(options);
    expect(options[0]!.label).toContain('Оптимально');
    expect(options[0]!.pros.length).toBeGreaterThan(0);
    expect(options[1]!.cons.length).toBeGreaterThan(0);
  });
});

describe('getDrivingRouteAlternatives', () => {
  const from = { lat: 46.48, lng: 30.72 };
  const to = { lat: 46.49, lng: 30.73 };

  beforeEach(() => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-key');
    vi.mocked(getRoute).mockResolvedValue({
      coordinates: [
        [30.72, 46.48],
        [30.73, 46.49],
      ],
      distanceKm: 2,
      durationMinutes: 5,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('сортує варіанти за duration_in_traffic (швидший перший)', async () => {
    const payload = {
      status: 'OK',
      routes: [
        {
          summary: 'Повільніший',
          legs: [
            {
              distance: { value: 5000 },
              duration: { value: 600 },
              duration_in_traffic: { value: 900 },
            },
          ],
          overview_polyline: { points: SAMPLE_POLYLINE },
        },
        {
          summary: 'Швидший',
          legs: [
            {
              distance: { value: 4000 },
              duration: { value: 400 },
              duration_in_traffic: { value: 300 },
            },
          ],
          overview_polyline: { points: SAMPLE_POLYLINE_ALT },
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      })
    );

    const result = await getDrivingRouteAlternatives(from, to);
    expect(result.trafficAware).toBe(true);
    expect(result.options.length).toBe(2);
    expect(result.recommendedIndex).toBe(0);
    expect(result.options[0]!.durationInTrafficSeconds).toBeLessThanOrEqual(result.options[1]!.durationInTrafficSeconds);
    expect(result.options[0]!.pros.length).toBeGreaterThan(0);
    expect(result.options[0]!.label).toContain('Рекомендовано');
  });

  it('збирає координати з steps (детальна геометрія), а не лише з overview', async () => {
    const overviewOnly = decodeEncodedPolyline(SAMPLE_POLYLINE);
    const payload = {
      status: 'OK',
      routes: [
        {
          summary: 'З кроками',
          legs: [
            {
              distance: { value: 4000 },
              duration: { value: 400 },
              duration_in_traffic: { value: 400 },
              steps: [
                { polyline: { points: SAMPLE_POLYLINE } },
                { polyline: { points: SAMPLE_POLYLINE_ALT } },
              ],
            },
          ],
          overview_polyline: { points: SAMPLE_POLYLINE },
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      })
    );

    const result = await getDrivingRouteAlternatives(from, to);
    expect(result.options.length).toBe(1);
    const coords = result.options[0]!.coordinates;
    expect(coords.length).toBeGreaterThanOrEqual(2);
    expect(coords.length).toBeGreaterThanOrEqual(overviewOnly.length);
  });

  it('при помилці Google використовує OSRM fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'REQUEST_DENIED', routes: [] }),
      })
    );

    const result = await getDrivingRouteAlternatives(from, to);
    expect(result.trafficAware).toBe(true);
    expect(result.options.length).toBe(1);
    expect(vi.mocked(getRoute)).toHaveBeenCalled();
  });
});
