/**
 * Кольори маркерів, маршруту та підкладки карти Strum (клієнт + водій).
 */
import { colors } from '../theme';

export const MAP_SURFACE = {
  /** Суша — один відтінок сірого */
  land: '#D4D4D8',
  /** Дороги — темніший сірий */
  road: '#8A8A93',
  roadCasing: '#767680',
  /** Будівлі — легкий беж */
  building: '#E8E2D6',
  /** Водойми — тьмяно-блакитний */
  water: '#B0C4CE',
  background: '#D4D4D8',
} as const;

export const MAP_VISUAL = {
  /** Жовтий + чорний акцент (як кнопки в додатку) */
  markerYellow: colors.primary,
  markerInk: colors.onPrimary,
  pickup: colors.primary,
  dropoff: colors.primary,
  route: '#2F80ED',
  routeWeight: 5,
  routeOpacity: 0.88,
  /** Material Icons: людина зараз */
  personIcon: 'my_location',
  personSize: 44,
  /** Material Icons: точка доставки */
  deliveryIcon: 'location_on',
  deliverySize: 48,
  deliveryStrokePx: 4,
  deliveryAnchorX: 24,
  deliveryAnchorY: 48,
} as const;

const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** MapLibre GL + Leaflet-адаптер для векторної підкладки з кастомними кольорами */
export function leafletMaplibreGlHead(): string {
  const bg = MAP_SURFACE.background;
  return `
    <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
      #map { background: ${bg}; }
      .maplibregl-map { font-family: inherit; }
    </style>
  `;
}

export function leafletMaplibreGlScripts(): string {
  return `
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script src="https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/dist/leaflet-maplibre-gl.js"></script>
  `;
}

/** Google Material Icons */
export function leafletMaterialIconsHead(): string {
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />`;
}

/** Патч стилю liberty + ініціалізація підкладки */
export function leafletStrumBasemapJs(): string {
  return `
    var STRUM_SURFACE = ${JSON.stringify(MAP_SURFACE)};
    var STRUM_BASEMAP_STYLE_URL = '${LIBERTY_STYLE_URL}';
    function patchStrumMapStyle(style) {
      var S = STRUM_SURFACE;
      style.layers.forEach(function(layer) {
        if (!layer.paint) return;
        var id = layer.id || '';
        var sl = layer['source-layer'];
        var type = layer.type;
        if (type === 'background') {
          layer.paint['background-color'] = S.land;
          return;
        }
        if (id === 'natural_earth') {
          layer.paint['raster-opacity'] = 0;
          return;
        }
        if (sl === 'water' || (id.indexOf('water') === 0 && type === 'fill')) {
          if (layer.paint['fill-color']) layer.paint['fill-color'] = S.water;
          return;
        }
        if (sl === 'waterway' || id.indexOf('waterway') === 0) {
          if (layer.paint['line-color']) layer.paint['line-color'] = S.water;
          return;
        }
        if (sl === 'building' || id.indexOf('building') === 0) {
          if (layer.paint['fill-color']) layer.paint['fill-color'] = S.building;
          if (layer.paint['fill-extrusion-color']) layer.paint['fill-extrusion-color'] = S.building;
          if (layer.paint['fill-outline-color']) layer.paint['fill-outline-color'] = S.building;
          return;
        }
        if (sl === 'transportation' && type === 'line') {
          if (layer.paint['line-color']) {
            layer.paint['line-color'] = id.indexOf('casing') !== -1 ? S.roadCasing : S.road;
          }
          return;
        }
        if (type === 'fill' && (sl === 'landcover' || sl === 'landuse' || sl === 'park' || sl === 'aeroway')) {
          if (layer.paint['fill-color']) layer.paint['fill-color'] = S.land;
          if (layer.paint['fill-outline-color']) layer.paint['fill-outline-color'] = S.land;
        }
      });
      return style;
    }
    function initStrumBasemap(map, onReady) {
      fetch(STRUM_BASEMAP_STYLE_URL)
        .then(function(r) { return r.json(); })
        .then(function(style) {
          patchStrumMapStyle(style);
          L.maplibreGL({ style: style, interactive: false, attribution: '' }).addTo(map);
          if (typeof onReady === 'function') onReady();
          try { map.fire('strum:basemap'); } catch (e) {}
        })
        .catch(function() {
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd', maxZoom: 19, opacity: 0.92
          }).addTo(map);
          if (typeof onReady === 'function') onReady();
        });
    }
  `;
}

/** Блок JS для маркерів і маршруту */
export function leafletMapVisualsScriptBlock(): string {
  const {
    markerYellow,
    markerInk,
    route,
    routeWeight,
    routeOpacity,
    personIcon,
    personSize,
    deliveryIcon,
    deliverySize,
    deliveryStrokePx,
    deliveryAnchorX,
    deliveryAnchorY,
  } = MAP_VISUAL;
  const personAnchor = personSize / 2;
  const badge = Math.round(personSize * 0.92);
  const glyphInBadge = Math.round(personSize * 0.58);
  return `
    var MAP_MARKER_YELLOW = '${markerYellow}';
    var MAP_MARKER_INK = '${markerInk}';
    var MAP_ROUTE = '${route}';
    var MAP_ROUTE_OPTS = { color: MAP_ROUTE, weight: ${routeWeight}, opacity: ${routeOpacity}, lineJoin: 'round', lineCap: 'round' };
    var MAP_PICKUP = MAP_MARKER_YELLOW;
    var MAP_DROPOFF = MAP_MARKER_YELLOW;
    var MAP_PERSON_GLYPH = '${personIcon}';
    var MAP_PERSON_SIZE = ${personSize};
    var MAP_PERSON_AX = ${personAnchor};
    var MAP_PERSON_BADGE = ${badge};
    var MAP_PERSON_GLYPH_IN = ${glyphInBadge};
    var MAP_DELIVERY_GLYPH = '${deliveryIcon}';
    var MAP_DELIVERY_SIZE = ${deliverySize};
    var MAP_DELIVERY_AX = ${deliveryAnchorX};
    var MAP_DELIVERY_AY = ${deliveryAnchorY};
    function buildPersonIcon() {
      var html = '<div style="width:' + MAP_PERSON_SIZE + 'px;height:' + MAP_PERSON_SIZE + 'px;display:flex;align-items:center;justify-content:center;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18))">' +
        '<div style="width:' + MAP_PERSON_BADGE + 'px;height:' + MAP_PERSON_BADGE + 'px;border-radius:50%;background:' + MAP_MARKER_YELLOW + ';border:2px solid ' + MAP_MARKER_INK + ';display:flex;align-items:center;justify-content:center;box-sizing:border-box">' +
        '<span class="material-icons" style="font-size:' + MAP_PERSON_GLYPH_IN + 'px;line-height:1;color:' + MAP_MARKER_INK + '">' + MAP_PERSON_GLYPH + '</span></div></div>';
      return L.divIcon({
        className: 'strum-person-marker',
        html: html,
        iconSize: [MAP_PERSON_SIZE, MAP_PERSON_SIZE],
        iconAnchor: [MAP_PERSON_AX, MAP_PERSON_AX]
      });
    }
    function buildDeliveryIcon() {
      var stroke = '${deliveryStrokePx}px ' + MAP_MARKER_INK;
      var iconStyle = 'font-size:' + MAP_DELIVERY_SIZE + 'px;line-height:1;color:' + MAP_MARKER_YELLOW + ';-webkit-text-stroke:' + stroke + ';paint-order:stroke fill';
      var html = '<div style="width:' + MAP_DELIVERY_SIZE + 'px;height:' + MAP_DELIVERY_SIZE + 'px;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18))">' +
        '<span class="material-icons" style="' + iconStyle + '">' + MAP_DELIVERY_GLYPH + '</span></div>';
      return L.divIcon({
        className: 'strum-delivery-marker',
        html: html,
        iconSize: [MAP_DELIVERY_SIZE, MAP_DELIVERY_SIZE],
        iconAnchor: [MAP_DELIVERY_AX, MAP_DELIVERY_AY]
      });
    }
  `;
}
