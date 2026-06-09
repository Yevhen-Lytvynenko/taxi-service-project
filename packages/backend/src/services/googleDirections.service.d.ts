/**
 * Google Directions API: alternative driving routes with duration_in_traffic.
 * https://developers.google.com/maps/documentation/directions/overview
 */
export interface RouteAlternativeOption {
    id: string;
    durationSeconds: number;
    durationInTrafficSeconds: number;
    distanceMeters: number;
    summary: string;
    /** GeoJSON-style [lng, lat] per point */
    coordinates: Array<[number, number]>;
    /** Коротка назва варіанту для списку */
    label: string;
    pros: string[];
    cons: string[];
}
export interface RouteAlternativesResult {
    options: RouteAlternativeOption[];
    recommendedIndex: number;
    trafficAware: boolean;
}
/** Decode Google encoded polyline to [lng, lat][] (matches OSRM GeoJSON order). */
export declare function decodeEncodedPolyline(encoded: string): Array<[number, number]>;
/** Порівняння варіантів: плюси/мінуси українською для водія. */
export declare function enrichRouteOptions(options: RouteAlternativeOption[]): void;
export declare function getDrivingRouteAlternatives(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): Promise<RouteAlternativesResult>;
//# sourceMappingURL=googleDirections.service.d.ts.map