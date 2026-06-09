import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Platform, StyleSheet, View, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  leafletMapVisualsScriptBlock,
  leafletMaterialIconsHead,
  leafletMaplibreGlHead,
  leafletMaplibreGlScripts,
  leafletStrumBasemapJs,
  MAP_VISUAL,
} from './mapVisuals';

/** OSM та CDN очікують ідентифікований User-Agent; порожній/дефолтний у WebView інколи дає сірий екран без тайлів. */
const MAP_WEBVIEW_USER_AGENT = `StrumTaxi/1.0 (${Platform.OS}; OSM tiles; +https://openstreetmap.org/copyright)`;

export type TrackingPhase = 'to_pickup' | 'to_dropoff';

export interface OrderTrackingMapProps {
  driverPos: { lat: number; lng: number } | null;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  /** Route coordinates as [lat, lng][] (convert from OSRM [lng,lat] before passing) */
  routeCoordinates: Array<[number, number]>;
  phase: TrackingPhase;
  /** Pixels hidden at the bottom (e.g. bottom sheet) — shifts follow camera / fitBounds padding */
  bottomOverlayPx?: number;
  /** Під час поїздки (наприклад IN_PROGRESS) — без панорамування та зуму */
  interactionLocked?: boolean;
  style?: object;
}

/** PNG іконка авто на карті (замініть файл своїм зображенням). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DRIVER_CAR_PNG = require('../../assets/driver-car.png');

/** Leaflet + публічні растрові тайли OpenStreetMap (без Google Maps). */
function buildHTML(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  driverCarIconUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  ${leafletMaterialIconsHead()}
  ${leafletMaplibreGlHead()}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      position: fixed;
      inset: 0;
      overflow: hidden;
      touch-action: none;
      -webkit-overflow-scrolling: touch;
    }
    #map { position: absolute; left: 0; top: 0; right: 0; bottom: 0; width: 100%; height: 100%; }
    .leaflet-popup-content { margin: 10px 14px; }
    .leaflet-div-icon.pickup-marker,
    .leaflet-div-icon.dropoff-marker,
    .leaflet-div-icon.driver-marker,
    .leaflet-div-icon.strum-person-marker,
    .leaflet-div-icon.strum-delivery-marker {
      background: transparent !important;
      border: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  ${leafletMaplibreGlScripts()}
  <script>
    ${leafletStrumBasemapJs()}
    ${leafletMapVisualsScriptBlock()}
    var DRIVER_CAR_ICON_URL = ${JSON.stringify(driverCarIconUrl)};
    function buildDriverCarMarkerHtml() {
      var wrapStyle = 'width:48px;height:48px;display:flex;align-items:center;justify-content:center;transform:rotate(0deg);transform-origin:center center;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.38))';
      if (DRIVER_CAR_ICON_URL) {
        return '<div class="driver-car-rot" style="' + wrapStyle + '">' +
          '<img src="' + DRIVER_CAR_ICON_URL + '" width="48" height="48" alt="" draggable="false"' +
          ' style="display:block;object-fit:contain;-webkit-user-drag:none;max-width:48px;max-height:48px;"/>' +
          '</div>';
      }
      return '<div class="driver-car-rot" style="' + wrapStyle + '">' +
        '<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="22" cy="24" rx="10" ry="14" fill="${MAP_VISUAL.pickup}"/>' +
        '<path d="M14 14 L22 8 L30 14 Z" fill="#E5C826"/>' +
        '</svg></div>';
    }
    var pickup = ${JSON.stringify([pickup.lat, pickup.lng])};
    var dropoff = ${JSON.stringify([dropoff.lat, dropoff.lng])};
    var bounds = L.latLngBounds([pickup, dropoff]);
    try {
      var ne0 = bounds.getNorthEast();
      var sw0 = bounds.getSouthWest();
      if (!bounds.isValid() || ne0.distanceTo(sw0) < 80) {
        bounds = bounds.pad(0.08);
      }
    } catch (e0) { bounds = bounds.pad(0.1); }
    var map = L.map('map', {
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    });
    var zoomCtrl = L.control.zoom({ position: 'topleft' }).addTo(map);

    var hadValidMapSize = false;
    function relayout() {
      try {
        map.invalidateSize(false);
        var s = map.getSize();
        if (s.x < 48 || s.y < 48) return;
        if (!hadValidMapSize) {
          hadValidMapSize = true;
          map.fitBounds(bounds.pad(0.2), { maxZoom: 15, animate: false });
        }
      } catch (e) {}
    }
    window.__invalidateMap = relayout;
    function onMapBasemapReady() {
      relayout();
      setTimeout(relayout, 0);
      setTimeout(relayout, 100);
      setTimeout(relayout, 300);
      setTimeout(relayout, 600);
    }
    initStrumBasemap(map, onMapBasemapReady);
    map.whenReady(onMapBasemapReady);
    window.addEventListener('resize', relayout);

    var markersLayer = L.layerGroup().addTo(map);
    var routeLayer = L.layerGroup().addTo(map);

    var routeDidOverviewFit = false;
    var followZoomApplied = false;
    var bottomOverlayPx = 0;
    /** Копія полілінії маршруту [lat,lng] для прив’язки іконки водія до лінії (без додаткових сегментів). */
    var routeLineForSnap = [];
    /** Остання проєкція водія на маршрут (кут руху по дорозі). */
    var lastDriverProject = null;
    var mapInteractionsLocked = false;
    /** Під час активної поїзді (пасажир у машині) — зсуваємо «центр» у верхню зону, авто нижче по екрану. */
    var tripVerticalBias = false;
    var driverHeadingDeg = 0;

    window.__setInteractionLocked = function(locked) {
      var on = !!locked;
      tripVerticalBias = on;
      if (on === mapInteractionsLocked) return;
      mapInteractionsLocked = on;
      if (on) {
        try {
          map.dragging.disable();
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.scrollWheelZoom.disable();
          map.boxZoom.disable();
          if (map.tap) map.tap.disable();
          if (map.keyboard) map.keyboard.disable();
        } catch (e) {}
        try { map.removeControl(zoomCtrl); } catch (e2) {}
      } else {
        try {
          map.dragging.enable();
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
          map.scrollWheelZoom.enable();
          map.boxZoom.enable();
          if (map.tap) map.tap.enable();
          if (map.keyboard) map.keyboard.enable();
        } catch (e) {}
        try { zoomCtrl.addTo(map); } catch (e2) {}
      }
    };

    window.__setBottomOverlay = function(px) {
      bottomOverlayPx = Math.max(0, parseInt(px, 10) || 0);
    };

    function addPickupMarker(lat, lng) {
      L.marker([lat, lng], { icon: buildPersonIcon() }).addTo(markersLayer).bindPopup('Ви тут');
    }
    function addDropoffMarker(lat, lng) {
      L.marker([lat, lng], { icon: buildDeliveryIcon() }).addTo(markersLayer).bindPopup('Доставка');
    }

    var driverMarker = null;
    var driverAnimFrame = null;
    var followCar = false;
    var CAMERA_LERP = 0.09;
    var DRIVER_MARKER_LERP = 0.22;
    var FOLLOW_MIN_ZOOM = 15;
    var FOLLOW_MAX_ZOOM = 17;

    /** Найближча точка на маршруті + азимут сегмента (щоб іконка стояла на жовтій лінії, а не «в будинку»). */
    function projectDriverToRoute(lat, lng) {
      if (!routeLineForSnap || routeLineForSnap.length < 2) {
        return { snapLat: lat, snapLng: lng, seg: 0, routeBearing: null };
      }
      var p = L.latLng(lat, lng);
      var bestPt = L.latLng(routeLineForSnap[0][0], routeLineForSnap[0][1]);
      var bestD = Infinity;
      var bestSeg = 0;
      for (var i = 0; i < routeLineForSnap.length - 1; i++) {
        var a0 = routeLineForSnap[i][0], a1 = routeLineForSnap[i][1];
        var b0 = routeLineForSnap[i + 1][0], b1 = routeLineForSnap[i + 1][1];
        for (var s = 0; s <= 24; s++) {
          var t = s / 24;
          var mlat = a0 + t * (b0 - a0);
          var mlng = a1 + t * (b1 - a1);
          var m = L.latLng(mlat, mlng);
          var d = p.distanceTo(m);
          if (d < bestD) {
            bestD = d;
            bestPt = m;
            bestSeg = i;
          }
        }
      }
      var rb = bearingBetweenDeg(
        routeLineForSnap[bestSeg][0],
        routeLineForSnap[bestSeg][1],
        routeLineForSnap[bestSeg + 1][0],
        routeLineForSnap[bestSeg + 1][1]
      );
      return { snapLat: bestPt.lat, snapLng: bestPt.lng, seg: bestSeg, routeBearing: rb };
    }

    function redrawFullRoutePolyline() {
      routeLayer.clearLayers();
      if (!routeLineForSnap || routeLineForSnap.length < 2) return;
      var latLngArr = routeLineForSnap.map(function(pt) { return [pt[0], pt[1]]; });
      L.polyline(latLngArr, MAP_ROUTE_OPTS).addTo(routeLayer);
    }

    /** Лишаємо на карті лише шлях попереду водія (пройдена смуга зникає). */
    function applyRouteAheadPolyline(pr) {
      if (!routeLineForSnap || routeLineForSnap.length < 2 || !driverMarker) return;
      var seg = Math.max(0, Math.min(pr.seg, routeLineForSnap.length - 2));
      var startPt = [pr.snapLat, pr.snapLng];
      var latLngArr = [startPt];
      for (var j = seg + 1; j < routeLineForSnap.length; j++) {
        latLngArr.push([routeLineForSnap[j][0], routeLineForSnap[j][1]]);
      }
      if (latLngArr.length >= 2) {
        var p0 = latLngArr[0], p1 = latLngArr[1];
        if (Math.abs(p0[0] - p1[0]) < 1e-8 && Math.abs(p0[1] - p1[1]) < 1e-8) latLngArr.shift();
      }
      routeLayer.clearLayers();
      if (latLngArr.length < 2) return;
      L.polyline(latLngArr, MAP_ROUTE_OPTS).addTo(routeLayer);
    }

    window.__setFollowCar = function(on) {
      followCar = !!on;
      if (!followCar) {
        followZoomApplied = false;
      }
    };

    function biasCenterForDriver(ll, zoom) {
      if (!tripVerticalBias) return ll;
      var s = map.getSize();
      if (s.y < 32) return ll;
      var frac = 0.56;
      var mpp = 156543.03392 * Math.cos(ll.lat * Math.PI / 180) / Math.pow(2, zoom);
      var offsetNorthM = (frac - 0.5) * s.y * mpp;
      var dLat = (offsetNorthM / 6378137) * (180 / Math.PI);
      return L.latLng(ll.lat + dLat, ll.lng);
    }

    function bearingBetweenDeg(lat1, lng1, lat2, lng2) {
      var p1 = lat1 * Math.PI / 180;
      var p2 = lat2 * Math.PI / 180;
      var dL = (lng2 - lng1) * Math.PI / 180;
      var y = Math.sin(dL) * Math.cos(p2);
      var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dL);
      var brng = Math.atan2(y, x) * 180 / Math.PI;
      return (brng + 360) % 360;
    }

    function shortestAngleDelta(fromDeg, toDeg) {
      var d = (toDeg - fromDeg) % 360;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      return d;
    }

    function applyDriverHeadingFromMove(fromLat, fromLng, toLat, toLng) {
      if (!driverMarker) return;
      var d = map.distance(L.latLng(fromLat, fromLng), L.latLng(toLat, toLng));
      if (d < 1.2) return;
      var tgt = bearingBetweenDeg(fromLat, fromLng, toLat, toLng);
      var delta = shortestAngleDelta(driverHeadingDeg, tgt);
      driverHeadingDeg = (driverHeadingDeg + delta * 0.2 + 360) % 360;
      var el = driverMarker.getElement && driverMarker.getElement();
      if (el) {
        var rot = el.querySelector('.driver-car-rot');
        if (rot) rot.style.transform = 'rotate(' + driverHeadingDeg + 'deg)';
      }
    }

    function applyDriverHeadingTowardRoute(tgtDeg, strength) {
      if (!driverMarker || tgtDeg == null || !isFinite(tgtDeg)) return;
      var k = Math.max(0.08, Math.min(1, strength));
      var delta = shortestAngleDelta(driverHeadingDeg, tgtDeg);
      driverHeadingDeg = (driverHeadingDeg + delta * k + 360) % 360;
      var el = driverMarker.getElement && driverMarker.getElement();
      if (el) {
        var rot = el.querySelector('.driver-car-rot');
        if (rot) rot.style.transform = 'rotate(' + driverHeadingDeg + 'deg)';
      }
    }

    /** У режимі поїзді камера «дивиться» трохи на північ від авто — дорога попереду в верхній половині. */
    function applyFollowCamera() {
      if (!followCar || !driverMarker) return;
      var s = map.getSize();
      if (s.x < 16 || s.y < 16) return;
      var p = driverMarker.getLatLng();
      var z = map.getZoom();
      var targetCenter = biasCenterForDriver(p, z);
      var c = map.getCenter();
      var distM = c.distanceTo(targetCenter);
      if (distM < 0.5) return;
      var k = CAMERA_LERP;
      var nlat = c.lat + (targetCenter.lat - c.lat) * k;
      var nlng = c.lng + (targetCenter.lng - c.lng) * k;
      if (!isFinite(nlat) || !isFinite(nlng)) return;
      if (!followZoomApplied) {
        followZoomApplied = true;
        if (z < FOLLOW_MIN_ZOOM) z = FOLLOW_MIN_ZOOM;
        if (z > FOLLOW_MAX_ZOOM) z = FOLLOW_MAX_ZOOM;
        var tc = biasCenterForDriver(p, z);
        map.setView([tc.lat, tc.lng], z, { animate: false });
        return;
      }
      map.setView([nlat, nlng], z, { animate: false });
    }

    window.__updateDriver = function(lat, lng) {
      var pr = projectDriverToRoute(lat, lng);
      lastDriverProject = pr;
      lat = pr.snapLat;
      lng = pr.snapLng;
      if (driverAnimFrame) { cancelAnimationFrame(driverAnimFrame); driverAnimFrame = null; }
      if (!driverMarker) {
        var carHtml = buildDriverCarMarkerHtml();
        var icon0 = L.divIcon({
          className: 'driver-marker',
          html: carHtml,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });
        driverHeadingDeg = pr.routeBearing != null ? pr.routeBearing : 0;
        driverMarker = L.marker([lat, lng], { icon: icon0 }).addTo(markersLayer).bindPopup('Водій');
        var cel = driverMarker.getElement && driverMarker.getElement();
        if (cel) {
          var rot0 = cel.querySelector('.driver-car-rot');
          if (rot0) rot0.style.transform = 'rotate(' + driverHeadingDeg + 'deg)';
        }
        applyRouteAheadPolyline(pr);
        if (followCar) {
          followZoomApplied = false;
          applyFollowCamera();
        }
        return;
      }
      if (pr.routeBearing != null) {
        applyDriverHeadingTowardRoute(pr.routeBearing, 0.32);
      }
      var tgtLat = lat, tgtLng = lng;
      applyRouteAheadPolyline(pr);
      function tick() {
        if (!driverMarker) { driverAnimFrame = null; return; }
        var cur = driverMarker.getLatLng();
        var dLat = tgtLat - cur.lat;
        var dLng = tgtLng - cur.lng;
        if (Math.abs(dLat) < 1e-7 && Math.abs(dLng) < 1e-7) {
          if (lastDriverProject && lastDriverProject.routeBearing != null) {
            applyDriverHeadingTowardRoute(lastDriverProject.routeBearing, 0.45);
          } else {
            applyDriverHeadingFromMove(cur.lat, cur.lng, tgtLat, tgtLng);
          }
          driverMarker.setLatLng([tgtLat, tgtLng]);
          var prDone = projectDriverToRoute(tgtLat, tgtLng);
          lastDriverProject = prDone;
          applyRouteAheadPolyline(prDone);
          if (followCar) applyFollowCamera();
          driverAnimFrame = null;
          return;
        }
        var a = DRIVER_MARKER_LERP;
        var nlat = cur.lat + dLat * a;
        var nlng = cur.lng + dLng * a;
        if (lastDriverProject && lastDriverProject.routeBearing != null) {
          applyDriverHeadingTowardRoute(lastDriverProject.routeBearing, 0.18);
        } else {
          applyDriverHeadingFromMove(cur.lat, cur.lng, nlat, nlng);
        }
        driverMarker.setLatLng([nlat, nlng]);
        if (followCar) applyFollowCamera();
        driverAnimFrame = requestAnimationFrame(tick);
      }
      driverAnimFrame = requestAnimationFrame(tick);
    };
    window.__removeDriver = function() {
      if (driverAnimFrame) { cancelAnimationFrame(driverAnimFrame); driverAnimFrame = null; }
      if (driverMarker) { markersLayer.removeLayer(driverMarker); driverMarker = null; }
      lastDriverProject = null;
      driverHeadingDeg = 0;
      followZoomApplied = false;
      redrawFullRoutePolyline();
    };

    window.__updateRoute = function(coords) {
      routeLineForSnap = [];
      lastDriverProject = null;
      if (!coords || coords.length < 2) {
        routeLayer.clearLayers();
        return;
      }
      var latLngArr = coords.map(function(c) { return [c[0], c[1]]; });
      routeLineForSnap = latLngArr.map(function(pt) { return [pt[0], pt[1]]; });
      redrawFullRoutePolyline();
      if (driverMarker) {
        var ll = driverMarker.getLatLng();
        var pr0 = projectDriverToRoute(ll.lat, ll.lng);
        applyRouteAheadPolyline(pr0);
      }
      if (followCar) {
        routeDidOverviewFit = true;
        return;
      }
      routeDidOverviewFit = false;
      try {
        var line = L.polyline(latLngArr);
        var rb = line.getBounds();
        rb.extend(pickup);
        rb.extend(dropoff);
        var padB = 16 + bottomOverlayPx;
        map.fitBounds(rb.pad(0.12), {
          maxZoom: 15,
          animate: true,
          duration: 0.65,
          easeLinearity: 0.2,
          paddingTopLeft: [16, 16],
          paddingBottomRight: [16, padB]
        });
        routeDidOverviewFit = true;
      } catch (e) {}
    };

    addPickupMarker(pickup[0], pickup[1]);
    addDropoffMarker(dropoff[0], dropoff[1]);
  </script>
</body>
</html>
`;
}

export function OrderTrackingMap({
  driverPos,
  pickup,
  dropoff,
  routeCoordinates,
  phase,
  bottomOverlayPx = 0,
  interactionLocked = false,
  style,
}: OrderTrackingMapProps) {
  const webViewRef = useRef<WebView>(null);
  const loadedRef = useRef(false);
  /** data:image/png;base64,... — WebView з baseUrl OSM не підвантажує file:// / localhost URI з <img>. */
  const driverCarDataUriRef = useRef<string | null>(null);
  const driverCarEncodeOnceRef = useRef(false);
  const [driverCarLoadedGen, setDriverCarLoadedGen] = useState(0);

  useEffect(() => {
    if (driverCarEncodeOnceRef.current) return;
    driverCarEncodeOnceRef.current = true;
    void (async () => {
      try {
        const { uri } = Image.resolveAssetSource(DRIVER_CAR_PNG);
        const r = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
          base64: true,
        });
        driverCarDataUriRef.current = r.base64 ? `data:image/png;base64,${r.base64}` : '';
      } catch {
        driverCarDataUriRef.current = '';
      }
      setDriverCarLoadedGen((g) => g + 1);
    })();
  }, []);

  const html = useMemo(() => {
    const embedded =
      driverCarDataUriRef.current && driverCarDataUriRef.current.length > 0
        ? driverCarDataUriRef.current
        : '';
    return buildHTML(pickup, dropoff, embedded);
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, driverCarLoadedGen]);

  const followCar = phase === 'to_pickup' || phase === 'to_dropoff';

  const injectFollow = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    wv.injectJavaScript(
      `(function(){ if(typeof window.__setFollowCar==='function') window.__setFollowCar(${followCar ? 'true' : 'false'}); })(); true;`
    );
  }, [followCar]);

  const injectDriverPos = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    if (driverPos) {
      wv.injectJavaScript(
        `(function(){ if(typeof window.__updateDriver==='function') window.__updateDriver(${driverPos.lat}, ${driverPos.lng}); })(); true;`
      );
    } else {
      wv.injectJavaScript(
        `(function(){ if(typeof window.__removeDriver==='function') window.__removeDriver(); })(); true;`
      );
    }
  }, [driverPos]);

  const injectRoute = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    const coordsJson = JSON.stringify(routeCoordinates);
    wv.injectJavaScript(
      `(function(){ if(typeof window.__updateRoute==='function') window.__updateRoute(${coordsJson}); })(); true;`
    );
    if (driverPos && Number.isFinite(driverPos.lat) && Number.isFinite(driverPos.lng)) {
      wv.injectJavaScript(
        `(function(){ if(typeof window.__updateDriver==='function') window.__updateDriver(${driverPos.lat}, ${driverPos.lng}); })(); true;`
      );
    }
  }, [routeCoordinates, driverPos]);

  const injectBottomOverlay = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    const px = Math.max(0, Math.round(bottomOverlayPx));
    wv.injectJavaScript(
      `(function(){ if(typeof window.__setBottomOverlay==='function') window.__setBottomOverlay(${px}); })(); true;`
    );
  }, [bottomOverlayPx]);

  const injectInteractionLocked = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    wv.injectJavaScript(
      `(function(){ if(typeof window.__setInteractionLocked==='function') window.__setInteractionLocked(${interactionLocked ? 'true' : 'false'}); })(); true;`
    );
  }, [interactionLocked]);

  useEffect(() => {
    injectFollow();
  }, [injectFollow]);

  useEffect(() => {
    injectDriverPos();
  }, [injectDriverPos]);

  useEffect(() => {
    injectRoute();
  }, [injectRoute]);

  useEffect(() => {
    injectBottomOverlay();
  }, [injectBottomOverlay]);

  useEffect(() => {
    injectInteractionLocked();
  }, [injectInteractionLocked]);

  const injectInvalidate = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    wv.injectJavaScript(
      `(function(){ if(typeof window.__invalidateMap==='function') window.__invalidateMap(); })(); true;`
    );
  }, []);

  const onWebViewLoad = useCallback(() => {
    loadedRef.current = true;
    injectBottomOverlay();
    injectFollow();
    injectInteractionLocked();
    injectRoute();
    injectDriverPos();
    injectInvalidate();
    setTimeout(() => injectInvalidate(), 200);
    setTimeout(() => injectInvalidate(), 500);
  }, [
    injectBottomOverlay,
    injectRoute,
    injectFollow,
    injectInteractionLocked,
    injectDriverPos,
    injectInvalidate,
  ]);

  const onContainerLayout = useCallback(() => {
    injectInvalidate();
  }, [injectInvalidate]);

  return (
    <View style={[styles.container, style]} onLayout={onContainerLayout}>
      <WebView
        key={`drvmap-${driverCarLoadedGen}`}
        ref={webViewRef}
        onLoadEnd={onWebViewLoad}
        source={{ html, baseUrl: 'https://tiles.openfreemap.org/' }}
        style={styles.webview}
        userAgent={MAP_WEBVIEW_USER_AGENT}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        setSupportMultipleWindows={false}
        allowFileAccess
        {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
});
