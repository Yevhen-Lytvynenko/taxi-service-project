import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { Button } from 'react-native-paper';
import io, { Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import api, { getApiBase } from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderTrackingMap, TrackingPhase } from '../components/OrderTrackingMap';
import { TripChatModal } from '../components/TripChatModal';
import { dialPeerPhone } from '../utils/phoneDial';
import { colors, spacing, radius, typography, mapBottomSheet, mapBottomSheetScroll } from '../theme';

interface Order {
  id: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  status: string;
  totalPrice: string | number;
  client?: { fullName: string; phone?: string | null };
  tariff?: { name: string };
  deliverySenderName?: string | null;
  deliverySenderPhone?: string | null;
  deliveryRecipientName?: string | null;
  deliveryRecipientPhone?: string | null;
  deliveryPayer?: 'SENDER' | 'RECIPIENT' | 'CLIENT' | null;
  plannedRoutePolyline?: Array<[number, number]> | null;
  navigationRouteToPickup?: Array<[number, number]> | null;
  navigationRouteToDropoff?: Array<[number, number]> | null;
  driver?: {
    id?: string;
    currentLat?: number | null;
    currentLng?: number | null;
  };
}

function deliveryPayerLabel(p: Order['deliveryPayer']): string {
  if (p === 'SENDER') return 'Відправник';
  if (p === 'RECIPIENT') return 'Отримувач';
  if (p === 'CLIENT') return 'Замовник у застосунку';
  return '—';
}

function isLngLatPolyline(p: unknown): p is Array<[number, number]> {
  if (!Array.isArray(p) || p.length < 2) return false;
  return p.every(
    (pt) =>
      Array.isArray(pt) &&
      pt.length >= 2 &&
      typeof pt[0] === 'number' &&
      typeof pt[1] === 'number'
  );
}

function hasNavPickup(o: Order): boolean {
  return isLngLatPolyline(o.navigationRouteToPickup);
}

function hasNavDropoff(o: Order): boolean {
  return isLngLatPolyline(o.navigationRouteToDropoff);
}

function lngLatPairsToLatLng(pairs: Array<[number, number]> | null | undefined): Array<[number, number]> {
  if (!pairs || !Array.isArray(pairs) || pairs.length < 2) return [];
  return pairs.map(([lng, lat]) => [lat, lng] as [number, number]);
}

const EARTH_RADIUS_M = 6_371_000;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Радіус для авто «На місці» / «Завершити» за GPS (без обов’язкового натискання). */
const AUTO_STATUS_BY_GEO_RADIUS_M = 115;
/** Ігноруємо дрібні стрибки GPS / ехо сокета — менше ре-рендерів і ін’єкцій у WebView. */
const MIN_DRIVER_POS_DELTA_M = 12;
/** Мінімум між перерахунком варіантів маршруту до підбіру при русі (сітка + час). */
const PICKUP_ALTS_MIN_INTERVAL_MS = 4500;

interface ActiveOrderScreenProps {
  navigation: { navigate: (name: string, params?: object) => void };
  route: { params?: { orderId?: string } };
}

type RouteOption = {
  id: string;
  durationInTrafficSeconds: number;
  distanceMeters: number;
  summary: string;
  coordinates: Array<[number, number]>;
  label?: string;
  pros?: string[];
  cons?: string[];
};

type RouteAlternativesResponse = {
  options: RouteOption[];
  recommendedIndex: number;
  trafficAware: boolean;
};

export const ActiveOrderScreen = ({ navigation, route }: ActiveOrderScreenProps) => {
  const orderId = route?.params?.orderId;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [order, setOrder] = useState<Order | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);

  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recommendedIdx, setRecommendedIdx] = useState(0);
  const [trafficAware, setTrafficAware] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [routeAltsError, setRouteAltsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const lastCommittedDriverPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const driverPosForAltsRef = useRef<{ lat: number; lng: number } | null>(null);
  const completedNavRef = useRef(false);
  const fetchOrderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mergeDriverPos = useCallback((lat: number, lng: number, opts?: { force?: boolean }) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const prev = lastCommittedDriverPosRef.current;
    if (!opts?.force && prev) {
      if (haversineMeters(prev.lat, prev.lng, lat, lng) < MIN_DRIVER_POS_DELTA_M) return;
    }
    lastCommittedDriverPosRef.current = { lat, lng };
    driverPosForAltsRef.current = { lat, lng };
    setDriverPos({ lat, lng });
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      const o = data as Order;
      setOrder(o);
      if (
        o.driver?.currentLat != null &&
        o.driver?.currentLng != null &&
        Number.isFinite(o.driver.currentLat) &&
        Number.isFinite(o.driver.currentLng)
      ) {
        mergeDriverPos(o.driver.currentLat, o.driver.currentLng, { force: true });
      }

      if (o.status === 'IN_PROGRESS' || o.status === 'COMPLETED') {
        if (hasNavDropoff(o)) {
          setRouteCoords(lngLatPairsToLatLng(o.navigationRouteToDropoff ?? undefined));
        } else {
          setRouteCoords([]);
        }
      } else if (o.status === 'ARRIVED' && hasNavDropoff(o)) {
        setRouteCoords(lngLatPairsToLatLng(o.navigationRouteToDropoff ?? undefined));
      } else if (o.status === 'ARRIVED' && !hasNavDropoff(o)) {
        setRouteCoords([]);
      } else if (o.status === 'ACCEPTED' && hasNavPickup(o)) {
        setRouteCoords(lngLatPairsToLatLng(o.navigationRouteToPickup ?? undefined));
      } else {
        setRouteCoords([]);
      }
    } catch {
      setError('Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  }, [orderId, mergeDriverPos]);

  const routeAltsRequestIdRef = useRef(0);

  const fetchRouteAlternatives = useCallback(
    async (leg: 'TO_PICKUP' | 'TO_DROPOFF') => {
      if (!order) return;
      const reqId = ++routeAltsRequestIdRef.current;
      setAltLoading(true);
      setRouteAltsError(null);
      try {
        let from: { lat: number; lng: number };
        let to: { lat: number; lng: number };
        const dp = driverPosForAltsRef.current;
        if (leg === 'TO_PICKUP') {
          from = dp ?? { lat: order.pickupLat - 0.008, lng: order.pickupLng };
          to = { lat: order.pickupLat, lng: order.pickupLng };
        } else {
          if (order.status === 'IN_PROGRESS') {
            from = dp ?? {
              lat: order.pickupLat,
              lng: order.pickupLng,
            };
          } else {
            from = { lat: order.pickupLat, lng: order.pickupLng };
          }
          to = { lat: order.dropoffLat, lng: order.dropoffLng };
        }
        const fromStr = `${from.lat},${from.lng}`;
        const toStr = `${to.lat},${to.lng}`;
        const { data } = (await api.get('/route/alternatives', {
          params: { from: fromStr, to: toStr },
        })) as { data: RouteAlternativesResponse };
        if (reqId !== routeAltsRequestIdRef.current) return;
        const opts = data.options ?? [];
        setRouteOptions(opts);
        setTrafficAware(data.trafficAware ?? false);
        const rec = Math.min(data.recommendedIndex ?? 0, Math.max(0, opts.length - 1));
        setRecommendedIdx(rec);
        setSelectedIdx(rec);
        if (opts.length === 0) {
          setRouteAltsError('Маршрут не знайдено. Спробуйте ще раз.');
        }
      } catch (e) {
        if (reqId !== routeAltsRequestIdRef.current) return;
        setRouteOptions([]);
        const msg = e instanceof Error && e.message ? e.message : 'Не вдалося завантажити маршрути';
        setRouteAltsError(msg);
      } finally {
        if (reqId === routeAltsRequestIdRef.current) {
          setAltLoading(false);
        }
      }
    },
    [order]
  );

  const confirmRoute = useCallback(
    async (leg: 'TO_PICKUP' | 'TO_DROPOFF') => {
      if (!orderId || routeOptions.length === 0) return;
      const opt = routeOptions[Math.min(selectedIdx, routeOptions.length - 1)];
      if (!opt) return;
      setUpdating(true);
      try {
        const { data } = await api.put(`/orders/${orderId}/route`, {
          leg,
          coordinates: opt.coordinates,
          distanceKm: opt.distanceMeters / 1000,
          durationMin: opt.durationInTrafficSeconds / 60,
        });
        const full = data as Order;
        setOrder(full);
        if (leg === 'TO_PICKUP') {
          setRouteCoords(lngLatPairsToLatLng(full.navigationRouteToPickup ?? undefined));
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            void api.post(`/orders/${orderId}/simulate`).catch(() => {
              /* у проді або без прав — лишається кнопка «Симуляція» */
            });
          }
        } else {
          setRouteCoords(lngLatPairsToLatLng(full.navigationRouteToDropoff ?? undefined));
        }
        setRouteOptions([]);
      } catch (err) {
        Alert.alert('Помилка', (err as Error).message);
      } finally {
        setUpdating(false);
      }
    },
    [orderId, routeOptions, selectedIdx]
  );

  const updateStatus = useCallback(
    async (status: string) => {
      if (!orderId) return;
      setOrder((prev) => (prev ? { ...prev, status } : null));
      setUpdating(true);
      try {
        await api.put(`/orders/${orderId}`, { status });
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data as Order);
      } catch (err) {
        setOrder((prev) => (prev ? { ...prev, status: prev.status } : null));
        Alert.alert('Помилка', (err as Error).message);
      } finally {
        setUpdating(false);
      }
    },
    [orderId]
  );

  const startSimulation = useCallback(async () => {
    if (!orderId) return;
    setSimulating(true);
    try {
      await api.post(`/orders/${orderId}/simulate`);
      Alert.alert('Симуляція', 'Симуляцію поїздки запущено');
    } catch (err) {
      Alert.alert('Помилка', (err as Error).message);
    } finally {
      setSimulating(false);
    }
  }, [orderId]);

  const cancelOrder = useCallback(() => {
    if (!orderId) return;
    Alert.alert('Скасувати замовлення?', 'Замовлення буде закрито, ви повернетеся в чергу.', [
      { text: 'Ні', style: 'cancel' },
      {
        text: 'Скасувати',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/orders/${orderId}`, { status: 'CANCELLED' });
            navigation.navigate('Order', { screen: 'OrdersQueue' });
          } catch (e) {
            Alert.alert('Помилка', (e as Error).message);
          }
        },
      },
    ]);
  }, [orderId, navigation]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!orderId) return;
    const socket = io(getApiBase(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', async () => {
      socket.emit('join_room', `order_${orderId}`);
      const meRes = await api.get('/auth/me');
      const user = meRes.data as { driverProfile?: { id: string } };
      if (user.driverProfile?.id) {
        socket.emit('join_room', `driver_tracking_${user.driverProfile.id}`);
      }
    });
    socket.on('order_status_changed', (payload: { status?: string }) => {
      if (payload?.status) {
        const s = payload.status;
        setOrder((prev) => (prev ? { ...prev, status: s } : null));
      }
      if (fetchOrderDebounceRef.current) clearTimeout(fetchOrderDebounceRef.current);
      fetchOrderDebounceRef.current = setTimeout(() => {
        fetchOrderDebounceRef.current = null;
        void fetchOrder();
      }, 320);
    });
    socket.on('driver_moved', (payload: { lat?: number; lng?: number }) => {
      if (typeof payload?.lat === 'number' && typeof payload?.lng === 'number') {
        mergeDriverPos(payload.lat, payload.lng);
      }
    });
    socket.on(
      'order_route_updated',
      (payload: { leg?: string; coordinates?: Array<[number, number]> }) => {
        const coords = payload?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        const latLng = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
        if (payload.leg === 'TO_DROPOFF') {
          setOrder((prev) => (prev ? { ...prev, navigationRouteToDropoff: coords } : null));
          setRouteCoords(latLng);
        } else if (payload.leg === 'TO_PICKUP') {
          setOrder((prev) => (prev ? { ...prev, navigationRouteToPickup: coords } : null));
          setRouteCoords(latLng);
        }
      }
    );
    return () => {
      if (fetchOrderDebounceRef.current) {
        clearTimeout(fetchOrderDebounceRef.current);
        fetchOrderDebounceRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, fetchOrder, mergeDriverPos]);

  useEffect(() => {
    if (!order) return;
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') return;
    if (completedNavRef.current) return;
    completedNavRef.current = true;
    navigation.navigate('Order', { screen: 'OrdersQueue' });
  }, [order?.status, navigation]);

  useEffect(() => {
    if (!order || !driverPos || updating) return;
    const { lat, lng } = driverPos;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (order.status === 'ACCEPTED' && hasNavPickup(order)) {
      if (haversineMeters(lat, lng, order.pickupLat, order.pickupLng) <= AUTO_STATUS_BY_GEO_RADIUS_M) {
        void updateStatus('ARRIVED');
      }
      return;
    }

    if (order.status === 'IN_PROGRESS' && hasNavDropoff(order)) {
      if (haversineMeters(lat, lng, order.dropoffLat, order.dropoffLng) <= AUTO_STATUS_BY_GEO_RADIUS_M) {
        void updateStatus('COMPLETED');
      }
    }
  }, [order, driverPos, updating, updateStatus]);

  // GPS tracking
  const locationSubRef = useRef<{ remove: () => void } | null>(null);
  const lastLocEmitRef = useRef<number>(0);
  const orderTripStatusRef = useRef<string | null>(null);
  const orderIdRef = useRef<string | undefined>(orderId);
  orderIdRef.current = orderId;

  useEffect(() => {
    orderTripStatusRef.current = order?.status ?? null;
  }, [order?.status]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        const user = data as { driverProfile?: { id: string } };
        const driverId = user.driverProfile?.id;
        if (!driverId || !mounted) return;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
          (loc) => {
            const { latitude, longitude } = loc.coords;
            const now = Date.now();
            if (now - lastLocEmitRef.current < 2500) return;
            lastLocEmitRef.current = now;
            mergeDriverPos(latitude, longitude);
            const trip = orderTripStatusRef.current;
            const activeTrip = trip === 'ACCEPTED' || trip === 'ARRIVED' || trip === 'IN_PROGRESS';
            socketRef.current?.emit('update_location', {
              driverId,
              lat: latitude,
              lng: longitude,
              status: 'BUSY',
              ...(activeTrip && orderIdRef.current ? { orderId: orderIdRef.current } : {}),
            });
          }
        );
        locationSubRef.current = sub;
      } catch { /* ignore */ }
    })();
    return () => {
      mounted = false;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, [mergeDriverPos]);

  const altsFetchedPickupRef = useRef(false);
  const altsFetchedDropoffRef = useRef(false);
  const pickupAltsRefetchKeyRef = useRef<string | null>(null);
  const lastPickupAltFetchAtRef = useRef(0);
  const prevStatusDropoffRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!order) return;
    const st = order.status;
    const prev = prevStatusDropoffRef.current;
    if (prev === 'ARRIVED' && st === 'IN_PROGRESS' && !hasNavDropoff(order)) {
      altsFetchedDropoffRef.current = false;
      setRouteOptions([]);
    }
    prevStatusDropoffRef.current = st;
  }, [order]);

  useEffect(() => {
    if (!order || order.status !== 'ACCEPTED' || hasNavPickup(order) || altsFetchedPickupRef.current) {
      return;
    }
    altsFetchedPickupRef.current = true;
    void fetchRouteAlternatives('TO_PICKUP');
  }, [order, fetchRouteAlternatives]);

  useEffect(() => {
    if (!order || hasNavDropoff(order)) return;
    if (order.status !== 'ARRIVED' && order.status !== 'IN_PROGRESS') return;
    if (altsFetchedDropoffRef.current) return;
    altsFetchedDropoffRef.current = true;
    void fetchRouteAlternatives('TO_DROPOFF');
  }, [order, fetchRouteAlternatives]);

  useEffect(() => {
    if (!order || order.status !== 'ACCEPTED' || hasNavPickup(order) || !driverPos) {
      return;
    }
    /** Сітка + мінімальний інтервал — менше паралельних викликів до бекенду під час руху. */
    const key = `${driverPos.lat.toFixed(3)},${driverPos.lng.toFixed(3)}`;
    if (pickupAltsRefetchKeyRef.current === key) return;
    const now = Date.now();
    if (
      pickupAltsRefetchKeyRef.current != null &&
      now - lastPickupAltFetchAtRef.current < PICKUP_ALTS_MIN_INTERVAL_MS
    ) {
      return;
    }
    pickupAltsRefetchKeyRef.current = key;
    lastPickupAltFetchAtRef.current = now;
    void fetchRouteAlternatives('TO_PICKUP');
  }, [order, driverPos, fetchRouteAlternatives]);

  useEffect(() => {
    altsFetchedPickupRef.current = false;
    altsFetchedDropoffRef.current = false;
    pickupAltsRefetchKeyRef.current = null;
    lastPickupAltFetchAtRef.current = 0;
    prevStatusDropoffRef.current = undefined;
    lastCommittedDriverPosRef.current = null;
    driverPosForAltsRef.current = null;
    completedNavRef.current = false;
    setRouteOptions([]);
    setSelectedIdx(0);
    setRouteAltsError(null);
    routeAltsRequestIdRef.current += 1;
  }, [orderId]);

  const pickerLeg: 'TO_PICKUP' | 'TO_DROPOFF' | null =
    order && order.status === 'ACCEPTED' && !hasNavPickup(order)
      ? 'TO_PICKUP'
      : order &&
          (order.status === 'ARRIVED' || order.status === 'IN_PROGRESS') &&
          !hasNavDropoff(order)
        ? 'TO_DROPOFF'
        : null;

  useEffect(() => {
    if (!pickerLeg) return;
    if (routeOptions.length === 0) return;
    const idx = Math.min(selectedIdx, routeOptions.length - 1);
    const coords = routeOptions[idx]?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      setRouteCoords(coords.map(([lng, lat]) => [lat, lng] as [number, number]));
    }
  }, [pickerLeg, routeOptions, selectedIdx]);

  // ─── Renders ───

  if (!orderId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Відсутній ID замовлення</Text>
        <Button onPress={() => navigation.navigate('Order', { screen: 'OrdersQueue' })}>Назад</Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Замовлення не знайдено'}</Text>
        <Button onPress={() => navigation.navigate('Order', { screen: 'OrdersQueue' })}>Назад</Button>
      </View>
    );
  }

  const showTripChat = !['CANCELLED'].includes(order.status);
  const chatCanSend = ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(order.status);

  // ── Route picker (перша нога: до pickup; друга: pickup → dropoff) ──
  if (pickerLeg) {
    const listIdx = Math.min(selectedIdx, Math.max(0, routeOptions.length - 1));
    const mapPhase: TrackingPhase = pickerLeg === 'TO_PICKUP' ? 'to_pickup' : 'to_dropoff';
    const pickerTitle =
      pickerLeg === 'TO_PICKUP'
        ? 'Маршрут до клієнта'
        : order.status === 'IN_PROGRESS'
          ? 'Маршрут до доставки (зараз)'
          : 'Маршрут до пункту призначення';
    const pickerSubtitle =
      pickerLeg === 'TO_PICKUP'
        ? `До підбіру: ${shortOrderAddress(order.pickupAddress)}`
        : order.status === 'IN_PROGRESS'
          ? `Після посадки → ${shortOrderAddress(order.dropoffAddress)}`
          : `${shortOrderAddress(order.pickupAddress)} → ${shortOrderAddress(order.dropoffAddress)}`;
    const pickerSheetMaxHeight = Math.round(height * 0.46);
    return (
      <>
      <View style={styles.pickerRoot}>
        <View style={[styles.pickerMapWrap, { paddingTop: insets.top }]}>
          <OrderTrackingMap
            driverPos={driverPos}
            pickup={{ lat: order.pickupLat, lng: order.pickupLng }}
            dropoff={{ lat: order.dropoffLat, lng: order.dropoffLng }}
            routeCoordinates={routeCoords}
            phase={mapPhase}
            style={styles.map}
          />
        </View>

        <View style={[styles.pickerSheet, { maxHeight: pickerSheetMaxHeight }]}>
          <ScrollView
            style={[styles.pickerScrollOuter, { maxHeight: pickerSheetMaxHeight }]}
            contentContainerStyle={[
              styles.pickerScrollContent,
              { paddingBottom: insets.bottom + spacing.md },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheetHandle} />
            <View style={styles.pickerHeaderRow}>
              <View style={styles.pickerHeaderText}>
                <Text style={styles.pickerTitle}>{pickerTitle}</Text>
                <Text style={styles.pickerSubtitle} numberOfLines={2}>
                  {pickerSubtitle}
                </Text>
              </View>
              {showTripChat ? (
                <View style={styles.pickerHeaderActions}>
                  <Pressable
                    style={styles.iconGhost}
                    onPress={() => setChatOpen(true)}
                    accessibilityLabel="Чат з пасажиром"
                  >
                    <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.onBackground} />
                  </Pressable>
                  {order.client?.phone ? (
                    <Pressable
                      style={styles.iconGhost}
                      onPress={() => dialPeerPhone(order.client?.phone)}
                      accessibilityLabel="Подзвонити пасажиру"
                    >
                      <MaterialCommunityIcons name="phone-outline" size={20} color={colors.onBackground} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            {altLoading && routeOptions.length === 0 ? (
              <View style={styles.pickerLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.pickerLoadingText}>Завантаження маршрутів…</Text>
              </View>
            ) : routeOptions.length === 0 ? (
              <View style={styles.pickerEmpty}>
                <Text style={styles.pickerErrorText}>
                  {routeAltsError ||
                    'Не вдалося отримати варіанти маршруту. Перевірте зв’язок або спробуйте пізніше.'}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => void fetchRouteAlternatives(pickerLeg)}
                  disabled={altLoading}
                  style={styles.pickerRetryBtn}
                  textColor={colors.primary}
                >
                  Спробувати знову
                </Button>
              </View>
            ) : (
              routeOptions.map((opt, i) => {
                const selected = i === listIdx;
                const minutes = Math.max(1, Math.round(opt.durationInTrafficSeconds / 60));
                const km = (opt.distanceMeters / 1000).toFixed(1);
                const isRec = i === recommendedIdx;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSelectedIdx(i)}
                    style={[styles.routeCard, selected && styles.routeCardSelected]}
                  >
                    <View style={styles.routeCardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.routeCardTitle, selected && styles.routeCardTitleSel]}>
                          {minutes} хв · {km} км
                        </Text>
                        {opt.label ? (
                          <Text style={styles.routeCardLabel} numberOfLines={1}>
                            {opt.label}
                          </Text>
                        ) : null}
                      </View>
                      {isRec ? <Text style={styles.recBadge}>★</Text> : null}
                    </View>
                    {opt.summary ? (
                      <Text style={styles.routeCardMeta} numberOfLines={2}>
                        {opt.summary}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })
            )}

            {routeOptions.length > 0 ? (
              <Text style={styles.trafficHint}>
                {trafficAware ? 'З урахуванням трафіку' : 'Орієнтовний час'}
              </Text>
            ) : null}

            <Button
              mode="contained"
              onPress={() => void confirmRoute(pickerLeg)}
              loading={updating}
              disabled={updating || routeOptions.length === 0}
              style={styles.pickerBtn}
              labelStyle={styles.pickerBtnLabel}
              buttonColor={colors.primary}
            >
              Підтвердити маршрут
            </Button>
            <Pressable style={styles.cancelLink} onPress={cancelOrder}>
              <Text style={styles.cancelLinkText}>Скасувати замовлення</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
      <TripChatModal
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        orderId={orderId}
        socket={socketRef.current}
        myRole="DRIVER"
        canSend={chatCanSend}
        emptyHint="Ще немає повідомлень. Напишіть пасажиру."
      />
      </>
    );
  }

  // ── Main screen (route chosen or status > ACCEPTED) ──
  const phase: TrackingPhase =
    order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? 'to_dropoff' : 'to_pickup';

  const statusLabels: Record<string, string> = {
    ACCEPTED: 'До клієнта',
    ARRIVED: 'Підбір',
    IN_PROGRESS: 'В дорозі',
    COMPLETED: 'Завершено',
    CANCELLED: 'Скасовано',
  };

  const sheetHeight = Math.min(height * 0.32, 260);
  const mapBottomOverlayPx = Math.round(sheetHeight);

  return (
    <>
    <View style={styles.container}>
      <View style={[styles.mapFullScreen, { paddingTop: insets.top }]}>
        <OrderTrackingMap
          driverPos={driverPos}
          pickup={{ lat: order.pickupLat, lng: order.pickupLng }}
          dropoff={{ lat: order.dropoffLat, lng: order.dropoffLng }}
          routeCoordinates={routeCoords}
          phase={phase}
          bottomOverlayPx={mapBottomOverlayPx}
          interactionLocked={order.status === 'IN_PROGRESS'}
          style={styles.map}
        />
      </View>

      <View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeadRow}>
            <View style={styles.sheetHeadText}>
              <Text style={styles.status}>{statusLabels[order.status] ?? order.status}</Text>
              {order.client ? (
                <Text style={styles.clientInfo} numberOfLines={1}>
                  {order.client.fullName}
                </Text>
              ) : null}
            </View>
            {showTripChat ? (
              <View style={styles.sheetHeadActions}>
                <Pressable
                  style={styles.iconGhost}
                  onPress={() => setChatOpen(true)}
                  accessibilityLabel="Чат з пасажиром"
                >
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.onBackground} />
                </Pressable>
                {order.client?.phone ? (
                  <Pressable
                    style={styles.iconGhost}
                    onPress={() => dialPeerPhone(order.client?.phone)}
                    accessibilityLabel="Подзвонити пасажиру"
                  >
                    <MaterialCommunityIcons name="phone-outline" size={20} color={colors.onBackground} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
          <Text style={styles.address} numberOfLines={2}>
            {shortOrderAddress(order.pickupAddress)} → {shortOrderAddress(order.dropoffAddress)}
          </Text>
          {order.tariff?.name === 'DELIVERY' &&
          (order.deliverySenderName || order.deliveryRecipientName) ? (
            <View style={styles.deliveryBox}>
              <Text style={styles.deliveryTitle}>Доставка</Text>
              {order.deliverySenderName ? (
                <Text style={styles.deliveryLine} numberOfLines={2}>
                  Відправник: {order.deliverySenderName}
                  {order.deliverySenderPhone ? ` · ${order.deliverySenderPhone}` : ''}
                </Text>
              ) : null}
              {order.deliveryRecipientName ? (
                <Text style={styles.deliveryLine} numberOfLines={2}>
                  Отримувач: {order.deliveryRecipientName}
                  {order.deliveryRecipientPhone ? ` · ${order.deliveryRecipientPhone}` : ''}
                </Text>
              ) : null}
              {order.deliveryPayer ? (
                <Text style={styles.deliveryLine}>Оплачує: {deliveryPayerLabel(order.deliveryPayer)}</Text>
              ) : null}
            </View>
          ) : null}
          <Text style={styles.price}>{String(order.totalPrice)} грн</Text>

          {order.status === 'ACCEPTED' && (
            <>
              <Button
                mode="contained"
                onPress={() => updateStatus('ARRIVED')}
                loading={updating}
                disabled={updating || !hasNavPickup(order)}
                style={styles.btn}
                buttonColor={colors.primary}
              >
                На місці
              </Button>
              <View style={styles.secondaryRow}>
                <Pressable style={styles.secondaryBtn} onPress={startSimulation} disabled={simulating}>
                  <Text style={styles.secondaryBtnText}>{simulating ? '...' : 'Симуляція'}</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={cancelOrder}>
                  <Text style={[styles.secondaryBtnText, styles.cancelText]}>Скасувати</Text>
                </Pressable>
              </View>
            </>
          )}
          {order.status === 'ARRIVED' && (
            <>
              <Text style={styles.passengerHint}>Очікуйте посадку пасажира</Text>
              <Button
                mode="contained"
                onPress={() => updateStatus('IN_PROGRESS')}
                loading={updating}
                disabled={updating}
                style={styles.btn}
                buttonColor={colors.primary}
              >
                В дорогу
              </Button>
              <View style={styles.secondaryRow}>
                <Pressable style={styles.secondaryBtn} onPress={startSimulation} disabled={simulating}>
                  <Text style={styles.secondaryBtnText}>{simulating ? '...' : 'Симуляція'}</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={cancelOrder}>
                  <Text style={[styles.secondaryBtnText, styles.cancelText]}>Скасувати</Text>
                </Pressable>
              </View>
            </>
          )}
          {order.status === 'IN_PROGRESS' && hasNavDropoff(order) && (
            <Button
              mode="contained"
              onPress={() => updateStatus('COMPLETED')}
              loading={updating}
              disabled={updating}
              style={styles.btn}
              buttonColor={colors.primary}
            >
              Завершити
            </Button>
          )}
          {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Order', { screen: 'OrdersQueue' })}
              style={styles.btn}
              buttonColor={colors.primary}
            >
              Замовлення
            </Button>
          )}
        </View>
      </View>
    </View>
    <TripChatModal
      visible={chatOpen}
      onClose={() => setChatOpen(false)}
      orderId={orderId}
      socket={socketRef.current}
      myRole="DRIVER"
      canSend={chatCanSend}
      emptyHint="Ще немає повідомлень. Напишіть пасажиру."
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  error: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },

  // ── Map ──
  mapFullScreen: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  map: { flex: 1, width: '100%', height: '100%' },

  // ── Bottom sheet (main) ──
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...mapBottomSheet,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetContent: { paddingHorizontal: spacing.md, flex: 1 },
  sheetHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeadText: { flex: 1, minWidth: 0 },
  sheetHeadActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconGhost: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
    marginBottom: 2,
  },
  clientInfo: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
  },
  address: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
    lineHeight: 20,
  },
  deliveryBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  deliveryLine: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    marginBottom: 2,
    lineHeight: 18,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
    marginTop: spacing.sm,
  },
  passengerHint: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
  },
  btn: { marginTop: spacing.sm, borderRadius: radius.md },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  secondaryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  secondaryBtnText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
  },
  cancelText: { color: colors.error },

  // ── Route picker ──
  pickerRoot: { flex: 1, backgroundColor: colors.background },
  pickerMapWrap: { flex: 1 },
  pickerSheet: {
    ...mapBottomSheet,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  pickerScrollOuter: {
    ...mapBottomSheetScroll,
  },
  pickerScrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pickerHeaderText: { flex: 1, minWidth: 0 },
  pickerHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  pickerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.onBackground,
    letterSpacing: -0.2,
  },
  pickerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  pickerLoading: { alignItems: 'center', paddingVertical: spacing.lg },
  pickerLoadingText: {
    marginTop: spacing.sm,
    color: colors.onSurfaceMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  pickerEmpty: { paddingVertical: spacing.md, alignItems: 'stretch' },
  pickerErrorText: {
    color: colors.onSurfaceMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerRetryBtn: { alignSelf: 'center', borderColor: colors.primary },
  routeCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeCardSelected: {
    borderColor: colors.onBackground,
    backgroundColor: colors.backgroundMuted,
  },
  routeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeCardTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.onBackground,
  },
  routeCardTitleSel: { color: colors.onBackground },
  recBadge: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.onSurfaceMuted,
    backgroundColor: colors.backgroundMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  routeCardLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    marginTop: 2,
  },
  routeCardMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    marginTop: 3,
  },
  trafficHint: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  pickerBtn: { borderRadius: radius.md, marginTop: spacing.xs },
  pickerBtnLabel: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
    paddingVertical: 4,
  },
  cancelLink: { alignItems: 'center', marginTop: spacing.xs, paddingVertical: spacing.sm },
  cancelLinkText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
});
