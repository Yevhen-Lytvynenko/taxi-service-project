import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapMarker {
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff';
  title: string;
}

const ODESA_CENTER = { lat: 46.4825, lng: 30.7233 };

interface OSMLeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapPress: (lat: number, lng: number) => void;
  style?: object;
}

/** Stable initial HTML - never reloads. Updates via window.updateMap(). */
const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${ODESA_CENTER.lat}, ${ODESA_CENTER.lng}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    
    var markersLayer = L.layerGroup().addTo(map);
    
    function addMarker(m) {
      var icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="width:24px;height:24px;border-radius:50%;background:' + 
          (m.type === 'pickup' ? '#ffd451' : '#2196F3') + ';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([m.lat, m.lng], { icon: icon }).addTo(markersLayer).bindPopup(m.title);
    }
    
    map.on('click', function(e) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });
    
    window.updateMap = function(center, zoom, markers, fitView) {
      markersLayer.clearLayers();
      (markers || []).forEach(addMarker);
      if (fitView && markers && markers.length > 0) {
        if (markers.length === 1) {
          map.setView([markers[0].lat, markers[0].lng], zoom || 15);
        } else {
          var bounds = L.latLngBounds(markers.map(function(m) { return [m.lat, m.lng]; }));
          map.fitBounds(bounds.pad(0.15), { maxZoom: zoom || 16 });
        }
      } else if (fitView && center) {
        map.setView([center.lat, center.lng], zoom || 13);
      }
    };
  </script>
</body>
</html>
`;

export function OSMLeafletMap({
  center,
  zoom = 13,
  markers = [],
  onMapPress,
  style,
}: OSMLeafletMapProps) {
  const webViewRef = useRef<WebView>(null);
  const loadedRef = useRef(false);

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
    const markersJson = JSON.stringify(markers);
    const centerJson = JSON.stringify(center);
    const fitView = markers.length >= 2;
    wv.injectJavaScript(
      `(function(){ if(typeof window.updateMap==='function'){ window.updateMap(${centerJson}, ${zoom}, ${markersJson}, ${fitView}); } })(); true;`
    );
  }, [center, zoom, markers]);

  useEffect(() => {
    injectUpdate();
  }, [injectUpdate]);

  const onLoadEnd = useCallback(() => {
    loadedRef.current = true;
    injectUpdate();
  }, [injectUpdate]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML, baseUrl: 'https://www.openstreetmap.org/' }}
        style={styles.webview}
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
    backgroundColor: 'transparent',
  },
});
