/**
 * OSRM routing proxy - returns route geometry and metrics for planned vs actual analytics.
 * https://router.project-osrm.org/
 */
export interface RouteResult {
    /** [lng, lat] per GeoJSON line */
    coordinates: Array<[number, number]>;
    distanceKm: number;
    durationMinutes: number;
}
/** Відстань між двома точками [lng, lat] у метрах (WGS84). */
export declare function haversineMeters(a: [number, number], b: [number, number]): number;
/** Наближений directed Hausdorff max(min відстань від зразків A до полілінії B, і симетрично). */
export declare function polylineHausdorffMaxMeters(a: Array<[number, number]>, b: Array<[number, number]>, sampleCap?: number): number;
export declare function polylineLengthMeters(coords: Array<[number, number]>): number;
/**
 * true, якщо дві геометрії фактично той самий коридор (той самий набір вулиць / майже паралельні шляхи).
 * Для різних варіантів потрібна помітна розбіжність у просторі.
 */
export declare function arePolylinesSameCorridor(a: Array<[number, number]>, b: Array<[number, number]>): boolean;
export declare function getRoute(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): Promise<RouteResult | null>;
/** Кілька варіантів маршруту (публічний OSRM, до ~3 альтернатив). */
export declare function getRouteAlternativesFromOsrm(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): Promise<RouteResult[]>;
/**
 * Другий варіант через проміжну точку (зміщення від середини сегмента),
 * якщо OSRM alternatives повернув лише один маршрут.
 */
export declare function getRouteWithViaWaypoint(from: {
    lat: number;
    lng: number;
}, via: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): Promise<RouteResult | null>;
export type DetourViaOptions = {
    /** Частка від from до to (0–1), де ставимо зміщену точку. */
    fractionAlong?: number;
    /** Напрямок перпендикуляра до хорди. */
    side?: 1 | -1;
    /** Зміщення перпендикулярно до напрямку руху, метри. */
    offsetMeters?: number;
};
/**
 * Проміжна точка поза прямою from→to (локальна ENU), щоб OSRM будував іншу гілку дорожньої мережі.
 */
export declare function detourViaPoint(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}, options?: DetourViaOptions): {
    lat: number;
    lng: number;
};
/**
 * Кілька стратегічних via-точок (різні місця вздовж хорди, сторони й радіус), щоб отримати реально різні вулиці.
 */
export declare function strategicDetourWaypoints(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): Array<{
    lat: number;
    lng: number;
}>;
//# sourceMappingURL=route.service.d.ts.map