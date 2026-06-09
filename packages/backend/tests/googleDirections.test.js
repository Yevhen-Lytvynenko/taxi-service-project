"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../src/services/route.service', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getRoute: vitest_1.vi.fn(),
        getRouteAlternativesFromOsrm: vitest_1.vi.fn().mockResolvedValue([]),
        getRouteWithViaWaypoint: vitest_1.vi.fn().mockResolvedValue(null),
    };
});
vitest_1.vi.mock('../src/services/trafficAnalytics.service', () => ({
    analyzeAndRankRoutes: vitest_1.vi.fn().mockImplementation(async (options) => {
        if (!options || options.length === 0) {
            return { options: [], recommendedIndex: 0, analyses: [] };
        }
        const scored = options
            .map((o, i) => ({ ...o, _origIdx: i }))
            .sort((a, b) => a.durationInTrafficSeconds - b.durationInTrafficSeconds);
        scored.forEach((o, idx) => {
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
const googleDirections_service_1 = require("../src/services/googleDirections.service");
const route_service_1 = require("../src/services/route.service");
const SAMPLE_POLYLINE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
/** Інша геометрія (з відхиленням від прямої), щоб не зливати варіанти як дублікати. */
const SAMPLE_POLYLINE_ALT = '_cuzG__ozDg^f^g^w|A';
(0, vitest_1.describe)('decodeEncodedPolyline', () => {
    (0, vitest_1.it)('повертає принаймні дві точки у форматі [lng, lat]', () => {
        const coords = (0, googleDirections_service_1.decodeEncodedPolyline)(SAMPLE_POLYLINE);
        (0, vitest_1.expect)(coords.length).toBeGreaterThanOrEqual(2);
        for (const p of coords) {
            (0, vitest_1.expect)(p.length).toBe(2);
            (0, vitest_1.expect)(typeof p[0]).toBe('number');
            (0, vitest_1.expect)(typeof p[1]).toBe('number');
        }
    });
});
(0, vitest_1.describe)('enrichRouteOptions', () => {
    (0, vitest_1.it)('додає label, pros і cons', () => {
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
                ],
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
                ],
                label: '',
                pros: [],
                cons: [],
            },
        ];
        (0, googleDirections_service_1.enrichRouteOptions)(options);
        (0, vitest_1.expect)(options[0].label).toContain('Оптимально');
        (0, vitest_1.expect)(options[0].pros.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(options[1].cons.length).toBeGreaterThan(0);
    });
});
(0, vitest_1.describe)('getDrivingRouteAlternatives', () => {
    const from = { lat: 46.48, lng: 30.72 };
    const to = { lat: 46.49, lng: 30.73 };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-key');
        vitest_1.vi.mocked(route_service_1.getRoute).mockResolvedValue({
            coordinates: [
                [30.72, 46.48],
                [30.73, 46.49],
            ],
            distanceKm: 2,
            durationMinutes: 5,
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllEnvs();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('сортує варіанти за duration_in_traffic (швидший перший)', async () => {
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
        vitest_1.vi.stubGlobal('fetch', vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        }));
        const result = await (0, googleDirections_service_1.getDrivingRouteAlternatives)(from, to);
        (0, vitest_1.expect)(result.trafficAware).toBe(true);
        (0, vitest_1.expect)(result.options.length).toBe(2);
        (0, vitest_1.expect)(result.recommendedIndex).toBe(0);
        (0, vitest_1.expect)(result.options[0].durationInTrafficSeconds).toBeLessThanOrEqual(result.options[1].durationInTrafficSeconds);
        (0, vitest_1.expect)(result.options[0].pros.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.options[0].label).toContain('Рекомендовано');
    });
    (0, vitest_1.it)('збирає координати з steps (детальна геометрія), а не лише з overview', async () => {
        const overviewOnly = (0, googleDirections_service_1.decodeEncodedPolyline)(SAMPLE_POLYLINE);
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
        vitest_1.vi.stubGlobal('fetch', vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        }));
        const result = await (0, googleDirections_service_1.getDrivingRouteAlternatives)(from, to);
        (0, vitest_1.expect)(result.options.length).toBe(1);
        const coords = result.options[0].coordinates;
        (0, vitest_1.expect)(coords.length).toBeGreaterThanOrEqual(2);
        (0, vitest_1.expect)(coords.length).toBeGreaterThanOrEqual(overviewOnly.length);
    });
    (0, vitest_1.it)('при помилці Google використовує OSRM fallback', async () => {
        vitest_1.vi.stubGlobal('fetch', vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'REQUEST_DENIED', routes: [] }),
        }));
        const result = await (0, googleDirections_service_1.getDrivingRouteAlternatives)(from, to);
        (0, vitest_1.expect)(result.trafficAware).toBe(true);
        (0, vitest_1.expect)(result.options.length).toBe(1);
        (0, vitest_1.expect)(vitest_1.vi.mocked(route_service_1.getRoute)).toHaveBeenCalled();
    });
});
//# sourceMappingURL=googleDirections.test.js.map