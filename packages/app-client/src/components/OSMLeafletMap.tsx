import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  MAP_SURFACE,
  leafletMapVisualsScriptBlock,
  leafletMaterialIconsHead,
  leafletMaplibreGlHead,
  leafletMaplibreGlScripts,
  leafletStrumBasemapJs,
} from './mapVisuals';

/** OSM очікує нормальний User-Agent; інакше WebView часто показує сірий екран без тайлів. */
const MAP_WEBVIEW_USER_AGENT = `StrumTaxi/1.0 (${Platform.OS}; OSM tiles; +https://openstreetmap.org/copyright)`;

export interface MapMarker {
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff';
  title: string;
}

/** Координати GeoJSON: [lng, lat] */
export type RoutePolylineLngLat = [number, number][];

const ODESA_CENTER = { lat: 46.4825, lng: 30.7233 };

interface OSMLeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  /** Наближений маршрут (OSRM), у форматі [lng, lat][] */
  routePolyline?: RoutePolylineLngLat | null | undefined;
  onMapPress: (lat: number, lng: number) => void;
  style?: object;
}

const MAP_VISUALS_JS = leafletMapVisualsScriptBlock();

/** Stable initial HTML - never reloads. Updates via window.updateMap(). */
const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  ${leafletMaterialIconsHead()}
  ${leafletMaplibreGlHead()}
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
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
    ${MAP_VISUALS_JS}
    var map = L.map('map', { zoomControl: true }).setView([${ODESA_CENTER.lat}, ${ODESA_CENTER.lng}], 13);
    initStrumBasemap(map, function() { window.__invalidateMap && window.__invalidateMap(); });
    
    var markersLayer = L.layerGroup().addTo(map);
    var routeLayer = null;

    window.__invalidateMap = function() {
      map.invalidateSize({ animate: false });
      setTimeout(function() { map.invalidateSize({ animate: false }); }, 80);
      setTimeout(function() { map.invalidateSize({ animate: false }); }, 280);
    };
    
    function addMarker(m) {
      var icon = m.type === 'pickup' ? buildPersonIcon() : buildDeliveryIcon();
      L.marker([m.lat, m.lng], { icon: icon }).addTo(markersLayer).bindPopup(m.title);
    }
    
    map.on('click', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });
    
    window.updateMap = function(center, zoom, markers, fitView, polylineLngLat) {
      markersLayer.clearLayers();
      (markers || []).forEach(addMarker);
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
      if (polylineLngLat && polylineLngLat.length >= 2) {
        var latlngs = polylineLngLat.map(function(p) { return [p[1], p[0]]; });
        routeLayer = L.polyline(latlngs, MAP_ROUTE_OPTS).addTo(map);
      }
      if (!fitView) {
        window.__invalidateMap();
        return;
      }
      var anim = { animate: true, duration: 0.22, easeLinearity: 0.35 };
      if (routeLayer) {
        var bounds = routeLayer.getBounds();
        (markers || []).forEach(function(m) { bounds.extend([m.lat, m.lng]); });
        map.fitBounds(bounds.pad(0.12), Object.assign({ maxZoom: zoom || 16 }, anim));
      } else if (markers && markers.length > 0) {
        if (markers.length === 1) {
          map.setView([markers[0].lat, markers[0].lng], zoom || 15, anim);
        } else {
          var b = L.latLngBounds(markers.map(function(m) { return [m.lat, m.lng]; }));
          map.fitBounds(b.pad(0.15), Object.assign({ maxZoom: zoom || 16 }, anim));
        }
      } else if (center) {
        map.setView([center.lat, center.lng], zoom || 13, anim);
      }
      window.__invalidateMap();
    };

    window.__invalidateMap();
  </script>
</body>
</html>
`;

export function OSMLeafletMap({
  center,
  zoom = 13,
  markers = [],
  routePolyline,
  onMapPress,
  style,
}: OSMLeafletMapProps) {
  const webViewRef = useRef<WebView>(null);
  const loadedRef = useRef(false);
  const lastGeometrySigRef = useRef<string | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const geometrySignature = useMemo(() => {
    const pts = (markers ?? []).map((m) => `${m.lat.toFixed(6)},${m.lng.toFixed(6)},${m.type}`).join(';');
    const poly =
      routePolyline && routePolyline.length >= 2
        ? JSON.stringify(routePolyline)
        : '';
    return `${pts}|${poly}`;
  }, [markers, routePolyline]);

  const centerRef = useRef(center);
  const markersRef = useRef(markers);
  const routeRef = useRef(routePolyline);
  centerRef.current = center;
  markersRef.current = markers;
  routeRef.current = routePolyline;

  const injectInvalidate = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    wv.injectJavaScript(
      `(function(){ if(typeof window.__invalidateMap==='function') window.__invalidateMap(); })(); true;`
    );
  }, []);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (typeof data.lat === 'number' && typeof data.lng === 'number') {
          onMapPress(data.lat, data.lng);
        }
      } catch {
        // ignore parse errors
      }
    },
    [onMapPress]
  );

  const injectUpdate = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv || !loadedRef.current) return;
    const markersSnap = markersRef.current;
    const centerSnap = centerRef.current;
    const routeSnap = routeRef.current;
    const markersJson = JSON.stringify(markersSnap);
    const centerJson = JSON.stringify(centerSnap);
    const hasRoute = !!(routeSnap && routeSnap.length >= 2);
    const polyJson = hasRoute ? JSON.stringify(routeSnap) : 'null';
    const prevSig = lastGeometrySigRef.current;
    const shouldRefit = prevSig === null || prevSig !== geometrySignature;
    lastGeometrySigRef.current = geometrySignature;
    const fitView = shouldRefit && (hasRoute || markersSnap.length >= 1 || prevSig === null);
    wv.injectJavaScript(
      `(function(){ if(typeof window.updateMap==='function'){ window.updateMap(${centerJson}, ${zoom}, ${markersJson}, ${fitView}, ${polyJson}); } })(); true;`
    );
  }, [geometrySignature, zoom]);

  useEffect(() => {
    injectUpdate();
  }, [injectUpdate]);

  const onLoadEnd = useCallback(() => {
    loadedRef.current = true;
    lastGeometrySigRef.current = null;
    injectUpdate();
    injectInvalidate();
    setTimeout(injectInvalidate, 200);
    setTimeout(injectInvalidate, 500);
  }, [injectUpdate, injectInvalidate]);

  const onContainerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      if (width < 1 || height < 1) return;
      setLayout((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    },
    []
  );

  useEffect(() => {
    if (layout.width > 0 && layout.height > 0) {
      injectInvalidate();
      const t = setTimeout(injectInvalidate, 150);
      return () => clearTimeout(t);
    }
  }, [layout.width, layout.height, injectInvalidate]);

  const mapReady = layout.width > 0 && layout.height > 0;

  return (
    <View style={[styles.container, style]} onLayout={onContainerLayout}>
      {mapReady ? (
        <WebView
          ref={webViewRef}
          source={{ html: LEAFLET_HTML, baseUrl: 'https://tiles.openfreemap.org/' }}
          style={{ width: layout.width, height: layout.height }}
          userAgent={MAP_WEBVIEW_USER_AGENT}
          scrollEnabled={false}
          bounces={false}
          onMessage={handleMessage}
          onLoadEnd={onLoadEnd}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : {})}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: MAP_SURFACE.background,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
