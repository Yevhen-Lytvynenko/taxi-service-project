import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type TrackingPhase = 'to_pickup' | 'to_dropoff';

interface OrderTrackingMapProps {
  driverPos: { lat: number; lng: number } | null;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  /** Route coordinates as [lat, lng][] (convert from OSRM [lng,lat] before passing) */
  routeCoordinates: Array<[number, number]>;
  phase: TrackingPhase;
  style?: object;
}

/** Stable HTML - only depends on pickup/dropoff. Route and driver updated via injectJS. */
function buildHTML(pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-popup-content { margin: 10px 14px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var pickup = ${JSON.stringify([pickup.lat, pickup.lng])};
    var dropoff = ${JSON.stringify([dropoff.lat, dropoff.lng])};
    var bounds = L.latLngBounds([pickup, dropoff]);
    var map = L.map('map', { zoomControl: true }).fitBounds(bounds.pad(0.2), { maxZoom: 16 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var routeLayer = L.layerGroup().addTo(map);

    function addPickupMarker(lat, lng) {
      var icon = L.divIcon({
        className: 'pickup-marker',
        html: '<div style="width:24px;height:24px;border-radius:50%;background:#ffd451;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([lat, lng], { icon: icon }).addTo(markersLayer).bindPopup('Підбір');
    }
    function addDropoffMarker(lat, lng) {
      var icon = L.divIcon({
        className: 'dropoff-marker',
        html: '<div style="width:24px;height:24px;border-radius:50%;background:#2196F3;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      L.marker([lat, lng], { icon: icon }).addTo(markersLayer).bindPopup('Висадка');
    }

    var driverMarker = null;
    window.__updateDriver = function(lat, lng) {
      if (driverMarker) {
        driverMarker.setLatLng([lat, lng]);
      } else {
        var icon = L.divIcon({
          className: 'driver-marker',
          html: '<div style="width:28px;height:28px;border-radius:50%;background:#4CAF50;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🚗</div>',
          iconSize: [28, 28], iconAnchor: [14, 14]
        });
        driverMarker = L.marker([lat, lng], { icon: icon }).addTo(markersLayer).bindPopup('Водій');
      }
    };
    window.__removeDriver = function() {
      if (driverMarker) { markersLayer.removeLayer(driverMarker); driverMarker = null; }
    };

    window.__updateRoute = function(coords) {
      routeLayer.clearLayers();
      if (coords && coords.length > 1) {
        var latLngArr = coords.map(function(c) { return [c[0], c[1]]; });
        L.polyline(latLngArr, { color: '#ffd451', weight: 5, opacity: 0.9 }).addTo(routeLayer);
      }
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
  style,
}: OrderTrackingMapProps) {
  const webViewRef = useRef<WebView>(null);
  const loadedRef = useRef(false);

  const html = useMemo(() => buildHTML(pickup, dropoff), [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

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
  }, [routeCoordinates]);

  useEffect(() => {
    injectDriverPos();
  }, [injectDriverPos]);

  useEffect(() => {
    injectRoute();
  }, [injectRoute]);

  const onWebViewLoad = useCallback(() => {
    loadedRef.current = true;
    injectRoute();
    injectDriverPos();
  }, [injectRoute, injectDriverPos]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        onLoadEnd={onWebViewLoad}
        source={{ html, baseUrl: 'https://www.openstreetmap.org/' }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
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
