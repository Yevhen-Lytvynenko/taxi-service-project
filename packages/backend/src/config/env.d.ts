/**
 * Centralized environment helpers. JWT_SECRET is required when NODE_ENV=production.
 */
export declare function getJwtSecret(): string;
/** CORS: comma-separated origins, or * / empty for allow-all (dev only). */
export declare function getCorsOrigin(): boolean | string | RegExp | (string | RegExp)[] | undefined;
export declare function getSocketIoCorsOrigin(): string | string[] | undefined;
export declare function getMatchingRadiusKm(): number;
export declare function getMatchDeadlineSeconds(): number;
/** Platform commission rate applied to completed order total (0–1). */
export declare function getPlatformCommissionRate(): number;
export declare function getSurgeMultiplier(): number;
export declare function getRedisUrl(): string | undefined;
/** Google Maps Platform key for Directions API (server-side only). */
export declare function getGoogleMapsApiKey(): string | undefined;
//# sourceMappingURL=env.d.ts.map