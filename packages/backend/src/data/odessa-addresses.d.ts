/**
 * Статичні адреси Одеси для емуляції (без геокодування Nominatim).
 * Межі міста: lat 46.38–46.58, lng 30.55–30.85
 */
export interface OdessaAddress {
    lat: number;
    lng: number;
    displayName: string;
}
export declare const ODESSA_ADDRESSES: OdessaAddress[];
/** Широкі межі (довідково) */
export declare const ODESSA_BOUNDS: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
};
/**
 * Межі емуляції: тільки суходіл (без відкритого моря на схід і південь від Одеси).
 * Східніше ~30,76 на середніх широтах — акваторія. Південь: обрізаємо «відкрите море»
 * лише разом із великою довготою (кламп точок у демоні). Західні низькі широти — суходіл.
 */
export declare const ODESSA_DRIVE_BOUNDS: {
    latMin: number;
    latMax: number;
    lngMin: number;
    /** Північ — можна ближче до 30,76; південь ріже maxLngOnLandForLat */
    lngMax: number;
};
export declare function clampToOdessaDriveBounds(lat: number, lng: number): {
    lat: number;
    lng: number;
};
//# sourceMappingURL=odessa-addresses.d.ts.map