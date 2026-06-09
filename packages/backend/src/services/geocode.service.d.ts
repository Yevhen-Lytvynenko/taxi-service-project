/**
 * Geocoding via OpenStreetMap Nominatim (free, no API key).
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
export interface GeocodeResult {
    lat: number;
    lng: number;
    /** Повна адреса (Nominatim display_name). */
    displayName: string;
    /** Скорочений підпис без індексу та країни — для полів у застосунку. */
    shortLabel: string;
}
export declare function geocodeAddress(address: string): Promise<GeocodeResult | null>;
export declare function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null>;
/**
 * Haversine formula - distance in km between two points.
 */
export declare function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number;
//# sourceMappingURL=geocode.service.d.ts.map