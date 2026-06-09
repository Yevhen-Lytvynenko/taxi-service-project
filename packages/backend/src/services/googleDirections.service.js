"use strict";
/**
 * Google Directions API: alternative driving routes with duration_in_traffic.
 * https://developers.google.com/maps/documentation/directions/overview
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeEncodedPolyline = decodeEncodedPolyline;
exports.enrichRouteOptions = enrichRouteOptions;
exports.getDrivingRouteAlternatives = getDrivingRouteAlternatives;
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const route_service_1 = require("./route.service");
const trafficAnalytics_service_1 = require("./trafficAnalytics.service");
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
/** Google зазвичай повертає до 3 маршрутів; OSRM — кілька; обрізаємо до 5. */
const MAX_OPTIONS = 5;
const GOOGLE_DIRECTIONS_TIMEOUT_MS = 18_000;
function directionsFetchSignal() {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(GOOGLE_DIRECTIONS_TIMEOUT_MS);
    }
    const c = new AbortController();
    setTimeout(() => c.abort(), GOOGLE_DIRECTIONS_TIMEOUT_MS);
    return c.signal;
}
/** Decode Google encoded polyline to [lng, lat][] (matches OSRM GeoJSON order). */
function decodeEncodedPolyline(encoded) {
    const coords = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    while (index < encoded.length) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;
        coords.push([lng / 1e5, lat / 1e5]);
    }
    return coords;
}
/**
 * Повний шлях по кроках ноги (детальні полілінії) — набагато ближче до реальних доріг,
 * ніж один overview_polyline (сильно спрощений).
 */
function coordinatesFromGoogleRoute(route) {
    const leg = route.legs?.[0];
    const steps = leg?.steps;
    if (steps && steps.length > 0) {
        const out = [];
        for (const step of steps) {
            const enc = step.polyline?.points;
            if (!enc || enc.length === 0)
                continue;
            const part = decodeEncodedPolyline(enc);
            for (const pt of part) {
                const prev = out[out.length - 1];
                if (prev &&
                    Math.abs(prev[0] - pt[0]) < 1e-7 &&
                    Math.abs(prev[1] - pt[1]) < 1e-7) {
                    continue;
                }
                out.push(pt);
            }
        }
        if (out.length >= 2) {
            return out;
        }
    }
    const enc = route.overview_polyline?.points;
    if (!enc || enc.length === 0)
        return null;
    const coordinates = decodeEncodedPolyline(enc);
    return coordinates.length >= 2 ? coordinates : null;
}
function routeToOption(route, index) {
    const leg = route.legs?.[0];
    if (!leg)
        return null;
    const distanceM = typeof leg.distance?.value === 'number' ? leg.distance.value : 0;
    const durationSec = typeof leg.duration?.value === 'number' ? leg.duration.value : 0;
    const inTraffic = typeof leg.duration_in_traffic?.value === 'number'
        ? leg.duration_in_traffic.value
        : durationSec;
    const coordinates = coordinatesFromGoogleRoute(route);
    if (!coordinates || coordinates.length < 2)
        return null;
    return {
        id: String(index),
        durationSeconds: durationSec,
        durationInTrafficSeconds: inTraffic,
        distanceMeters: distanceM,
        summary: route.summary ?? '',
        coordinates,
        label: '',
        pros: [],
        cons: [],
    };
}
/** Порівняння варіантів: плюси/мінуси українською для водія. */
function enrichRouteOptions(options) {
    if (options.length === 0)
        return;
    const bestTime = Math.min(...options.map((o) => o.durationInTrafficSeconds));
    const bestDist = Math.min(...options.map((o) => o.distanceMeters));
    options.forEach((o, i) => {
        const pros = [];
        const cons = [];
        const dtSec = o.durationInTrafficSeconds - bestTime;
        const ddM = o.distanceMeters - bestDist;
        const km = (o.distanceMeters / 1000).toFixed(1);
        const minDur = Math.max(1, Math.round(o.durationInTrafficSeconds / 60));
        if (i === 0) {
            o.label = 'Оптимально за часом';
            pros.push(`~${minDur} хв у дорозі, ${km} км`);
            pros.push('Найкоротший очікуваний час');
        }
        else {
            o.label = `Альтернатива ${i + 1}`;
            pros.push(`~${minDur} хв, ${km} км`);
            if (dtSec <= 90) {
                pros.push('Час майже як у найшвидшого варіанту');
            }
            else {
                cons.push(`Довше на ~${Math.round(dtSec / 60)} хв`);
            }
        }
        if (options.length > 1) {
            if (o.distanceMeters <= bestDist + 150) {
                pros.push('Найменша або близька до мінімальної відстань');
            }
            else if (ddM > 400) {
                cons.push(`Додатково ~${(ddM / 1000).toFixed(1)} км шляху`);
            }
        }
        if (o.summary) {
            pros.push(o.summary);
        }
        o.pros = [...new Set(pros)].slice(0, 2);
        o.cons = [...new Set(cons)].slice(0, 2);
    });
}
function roughlySameRoute(a, b) {
    const dt = Math.abs(a.durationInTrafficSeconds - b.durationInTrafficSeconds);
    const dd = Math.abs(a.distanceMeters - b.distanceMeters);
    return dt < 90 && dd < 350;
}
/** Дублікат, якщо ті самі вулиці (коридор) або дуже близька геометрія й майже однаковий час/відстань. */
function routesConsideredDuplicate(a, b) {
    if ((0, route_service_1.arePolylinesSameCorridor)(a.coordinates, b.coordinates))
        return true;
    const h = (0, route_service_1.polylineHausdorffMaxMeters)(a.coordinates, b.coordinates);
    return h < 110 && roughlySameRoute(a, b);
}
function dedupeRouteOptions(options) {
    const out = [];
    for (const o of options) {
        if (!out.some((p) => routesConsideredDuplicate(p, o)))
            out.push(o);
    }
    return out;
}
function mergeUniqueExtras(primary, extras, max) {
    const out = [...primary];
    for (const e of extras) {
        if (out.length >= max)
            break;
        if (!out.some((o) => routesConsideredDuplicate(o, e)))
            out.push(e);
    }
    return out;
}
function routeResultToOption(r, index) {
    const durationSec = Math.round(r.durationMinutes * 60);
    const distanceM = Math.round(r.distanceKm * 1000);
    return {
        id: String(index),
        durationSeconds: durationSec,
        durationInTrafficSeconds: durationSec,
        distanceMeters: distanceM,
        summary: '',
        coordinates: r.coordinates,
        label: '',
        pros: [],
        cons: [],
    };
}
/** Додати варіанти з OSRM / об’їзд, якщо Google або OSRM дав мало унікальних маршрутів. */
const MIN_DISTINCT_ROUTES = 3;
const MAX_DETOUR_ATTEMPTS = 8;
async function augmentOptionsIfSparse(from, to, options, max) {
    let out = dedupeRouteOptions([...options]);
    /** Якщо вже є достатньо різних варіантів — не чекаємо зайві послідовні запити до OSRM. */
    if (out.length >= Math.min(max, MIN_DISTINCT_ROUTES)) {
        return out.slice(0, max);
    }
    const osrm = (await (0, route_service_1.getRouteAlternativesFromOsrm)(from, to)) ?? [];
    const osrmOpts = osrm.map((r, i) => routeResultToOption(r, 100 + i));
    out = mergeUniqueExtras(out, osrmOpts, max);
    let detourAttempts = 0;
    let staleAdds = 0;
    const targetDistinct = Math.min(max, MIN_DISTINCT_ROUTES);
    for (const via of (0, route_service_1.strategicDetourWaypoints)(from, to)) {
        if (out.length >= targetDistinct)
            break;
        if (detourAttempts >= MAX_DETOUR_ATTEMPTS)
            break;
        if (staleAdds >= 4)
            break;
        detourAttempts += 1;
        const detour = await (0, route_service_1.getRouteWithViaWaypoint)(from, via, to);
        if (!detour) {
            staleAdds += 1;
            continue;
        }
        const before = out.length;
        out = mergeUniqueExtras(out, [routeResultToOption(detour, 500 + detourAttempts)], max);
        staleAdds = out.length === before ? staleAdds + 1 : 0;
    }
    return dedupeRouteOptions(out).slice(0, max);
}
async function fetchGoogleDirections(from, to, apiKey) {
    const origin = `${from.lat},${from.lng}`;
    const destination = `${to.lat},${to.lng}`;
    const departureTime = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
        origin,
        destination,
        mode: 'driving',
        alternatives: 'true',
        departure_time: String(departureTime),
        key: apiKey,
    });
    const url = `${DIRECTIONS_URL}?${params.toString()}`;
    const res = await fetch(url, { signal: directionsFetchSignal() });
    if (!res.ok) {
        logger_1.logger.warn({ status: res.status }, 'Google Directions HTTP error');
        return [];
    }
    const data = (await res.json());
    if (data.status !== 'OK' || !Array.isArray(data.routes)) {
        logger_1.logger.warn({ status: data.status, message: data.error_message }, 'Google Directions API not OK');
        return [];
    }
    return data.routes;
}
function osrmGeometryDuplicate(existing, candidate) {
    return existing.some((r) => (0, route_service_1.arePolylinesSameCorridor)(r.coordinates, candidate.coordinates));
}
async function appendStrategicDetours(from, to, routes, maxRoutes) {
    let out = [...routes];
    let attempts = 0;
    let staleAdds = 0;
    for (const via of (0, route_service_1.strategicDetourWaypoints)(from, to)) {
        if (out.length >= maxRoutes)
            break;
        if (attempts >= MAX_DETOUR_ATTEMPTS)
            break;
        if (staleAdds >= 4)
            break;
        attempts += 1;
        const detour = await (0, route_service_1.getRouteWithViaWaypoint)(from, via, to);
        if (!detour || osrmGeometryDuplicate(out, detour)) {
            staleAdds += 1;
            continue;
        }
        staleAdds = 0;
        out = [...out, detour];
    }
    return out;
}
async function fallbackOsrm(from, to) {
    let routes = (await (0, route_service_1.getRouteAlternativesFromOsrm)(from, to)) ?? [];
    if (routes.length >= 1 && routes.length < MIN_DISTINCT_ROUTES) {
        routes = await appendStrategicDetours(from, to, routes, MIN_DISTINCT_ROUTES);
    }
    if (routes.length === 0) {
        const route = await (0, route_service_1.getRoute)(from, to);
        if (!route || route.coordinates.length < 2) {
            return { options: [], recommendedIndex: 0, trafficAware: false };
        }
        routes = [route];
        routes = await appendStrategicDetours(from, to, routes, MIN_DISTINCT_ROUTES);
    }
    let options = routes.map((r, i) => routeResultToOption(r, i));
    options = await augmentOptionsIfSparse(from, to, options, MAX_OPTIONS);
    options.sort((a, b) => a.durationInTrafficSeconds - b.durationInTrafficSeconds);
    const ranked = await (0, trafficAnalytics_service_1.analyzeAndRankRoutes)(options);
    return {
        options: ranked.options,
        recommendedIndex: ranked.recommendedIndex,
        trafficAware: true,
    };
}
async function getDrivingRouteAlternatives(from, to) {
    const apiKey = (0, env_1.getGoogleMapsApiKey)();
    if (!apiKey) {
        logger_1.logger.debug('GOOGLE_MAPS_API_KEY missing, using OSRM fallback for route alternatives');
        return fallbackOsrm(from, to);
    }
    try {
        const rawRoutes = await fetchGoogleDirections(from, to, apiKey);
        const options = [];
        let i = 0;
        for (const r of rawRoutes) {
            const opt = routeToOption(r, i);
            if (opt) {
                options.push(opt);
                i += 1;
            }
        }
        if (options.length === 0) {
            return fallbackOsrm(from, to);
        }
        let merged = await augmentOptionsIfSparse(from, to, options, MAX_OPTIONS);
        merged.sort((a, b) => a.durationInTrafficSeconds - b.durationInTrafficSeconds);
        const ranked = await (0, trafficAnalytics_service_1.analyzeAndRankRoutes)(merged);
        return {
            options: ranked.options,
            recommendedIndex: ranked.recommendedIndex,
            trafficAware: true,
        };
    }
    catch (e) {
        logger_1.logger.warn({ err: e }, 'Google Directions request failed, falling back to OSRM');
        return fallbackOsrm(from, to);
    }
}
//# sourceMappingURL=googleDirections.service.js.map