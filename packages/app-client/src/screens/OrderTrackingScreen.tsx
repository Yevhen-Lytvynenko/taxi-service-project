import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  AppState,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import io, { Socket } from 'socket.io-client';
import api, { getApiBase } from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { OrderTrackingMap, TrackingPhase } from '../components/OrderTrackingMap';
import { TripChatModal } from '../components/TripChatModal';
import { TripReviewModal } from '../components/TripReviewModal';
import { dialPeerPhone } from '../utils/phoneDial';
import { colors, spacing, radius, typography, mapBottomSheet } from '../theme';

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
  plannedRoutePolyline?: Array<[number, number]> | null;
  navigationRouteToPickup?: Array<[number, number]> | null;
  navigationRouteToDropoff?: Array<[number, number]> | null;
  driver?: {
    id: string;
    currentLat?: number | null;
    currentLng?: number | null;
    user?: { fullName: string; phone?: string | null };
    vehicle?: { model: string };
  };
  reviews?: { id: string; authorId: string; rating: number }[];
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

interface OrderTrackingScreenProps {
  navigation: { navigate: (name: string, params?: object) => void };
  route: { params: { orderId: string } };
}

export const OrderTrackingScreen = ({ navigation, route }: OrderTrackingScreenProps) => {
  const orderId = route?.params?.orderId;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [order, setOrder] = useState<Order | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintSending, setComplaintSending] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const completedReviewHandledRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const driverTrackingIdRef = useRef<string | undefined>(undefined);
  const lastDriverMovedRef = useRef<number>(0);
  const prevOrderStatusRef = useRef<string | undefined>(undefined);
  /** Вирівнюємо з кроком симуляції на бекенді (~750 ms) без зайвого навантаження */
  const DRIVER_MOVED_THROTTLE_MS = 800;

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      const o = data as Order;
      setOrder(o);
      if (
        o?.driver?.currentLat != null &&
        o.driver.currentLng != null &&
        Number.isFinite(o.driver.currentLat) &&
        Number.isFinite(o.driver.currentLng)
      ) {
        setDriverPos({ lat: o.driver.currentLat, lng: o.driver.currentLng });
      }

      const legacy =
        o.plannedRoutePolyline &&
        Array.isArray(o.plannedRoutePolyline) &&
        o.plannedRoutePolyline.length >= 2;

      if (o.status === 'IN_PROGRESS' || o.status === 'COMPLETED') {
        const line =
          hasNavDropoff(o)
            ? o.navigationRouteToDropoff
            : o.status === 'COMPLETED' && legacy
              ? o.plannedRoutePolyline
              : null;
        setRouteCoords(lngLatPairsToLatLng(line ?? undefined));
      } else if (o.status === 'ARRIVED' && hasNavDropoff(o)) {
        setRouteCoords(lngLatPairsToLatLng(o.navigationRouteToDropoff ?? undefined));
      } else if (o.status === 'ARRIVED' && hasNavPickup(o) && !hasNavDropoff(o)) {
        setRouteCoords([]);
      } else if ((o.status === 'ACCEPTED' || o.status === 'ARRIVED') && hasNavPickup(o)) {
        setRouteCoords(lngLatPairsToLatLng(o.navigationRouteToPickup ?? undefined));
      } else if (legacy && o.status === 'SEARCHING') {
        setRouteCoords(lngLatPairsToLatLng(o.plannedRoutePolyline ?? undefined));
      } else {
        setRouteCoords([]);
      }
      return o;
    } catch {
      setError('Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchRouteAlternatives = useCallback(
    async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
      try {
        const fromStr = `${from.lat},${from.lng}`;
        const toStr = `${to.lat},${to.lng}`;
        const { data } = (await api.get('/route/alternatives', {
          params: { from: fromStr, to: toStr },
        })) as { data: { options?: Array<{ coordinates?: Array<[number, number]> }>; recommendedIndex?: number } };
        const opts = data.options ?? [];
        const rec = Math.min(data.recommendedIndex ?? 0, Math.max(0, opts.length - 1));
        const coords = opts[rec]?.coordinates;
        if (Array.isArray(coords) && coords.length > 1) {
          const latLng = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
          setRouteCoords(latLng);
        } else {
          setRouteCoords([]);
        }
      } catch {
        setRouteCoords([]);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useFocusEffect(
    useCallback(() => {
      void fetchOrder();
    }, [fetchOrder])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void fetchOrder();
    });
    return () => sub.remove();
  }, [fetchOrder]);

  useEffect(() => {
    void api.get('/auth/me').then((r) => setMyId((r.data as { id: string }).id)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!order) return;
    const prev = prevOrderStatusRef.current;
    prevOrderStatusRef.current = order.status;
    const tracking = ['SEARCHING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'];
    if (!prev || !tracking.includes(prev)) return;
    if (order.status === 'COMPLETED') {
      const alreadyReviewed =
        myId != null && (order.reviews ?? []).some((r) => r.authorId === myId);
      if (!alreadyReviewed && !completedReviewHandledRef.current) {
        completedReviewHandledRef.current = true;
        setReviewOpen(true);
        return;
      }
      if (!completedReviewHandledRef.current) {
        completedReviewHandledRef.current = true;
        navigation.navigate('Order', { screen: 'CreateOrder' });
      }
    } else if (order.status === 'CANCELLED') {
      Alert.alert('Замовлення скасовано', '', [
        { text: 'OK', onPress: () => navigation.navigate('Order', { screen: 'CreateOrder' }) },
      ]);
    }
  }, [order?.status, navigation, myId, order?.reviews]);

  const finishAfterReview = useCallback(() => {
    setReviewOpen(false);
    navigation.navigate('Order', { screen: 'CreateOrder' });
  }, [navigation]);

  driverTrackingIdRef.current = order?.driver?.id;

  useEffect(() => {
    if (!orderId) return;

    const socket = io(getApiBase(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const joinDriverRoomIfNeeded = () => {
      const did = driverTrackingIdRef.current;
      if (did) {
        socket.emit('join_room', `driver_tracking_${did}`);
      }
    };

    socket.on('connect', () => {
      socket.emit('join_room', `order_${orderId}`);
      joinDriverRoomIfNeeded();
    });

    socket.on('order_status_changed', async (payload: { status: string }) => {
      setOrder((prev) => (prev ? { ...prev, status: payload.status } : null));
      const updated = await fetchOrder();
      if (updated?.driver?.id && socketRef.current?.connected) {
        socketRef.current.emit('join_room', `driver_tracking_${updated.driver.id}`);
      }
    });

    socket.on('driver_moved', (data: { lat: number; lng: number }) => {
      const now = Date.now();
      if (now - lastDriverMovedRef.current >= DRIVER_MOVED_THROTTLE_MS) {
        lastDriverMovedRef.current = now;
        setDriverPos({ lat: data.lat, lng: data.lng });
      }
    });

    socket.on('order_route_updated', () => {
      void fetchOrder();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, fetchOrder]);

  useEffect(() => {
    const s = socketRef.current;
    const did = order?.driver?.id;
    if (!s?.connected || !did) return;
    s.emit('join_room', `driver_tracking_${did}`);
  }, [order?.driver?.id]);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'CANCELLED') {
      setRouteCoords([]);
      return;
    }

    const legacy =
      order.plannedRoutePolyline &&
      Array.isArray(order.plannedRoutePolyline) &&
      order.plannedRoutePolyline.length >= 2;

    if (order.status === 'IN_PROGRESS' && !hasNavDropoff(order) && !legacy) {
      setRouteCoords([]);
      return;
    }

    const toDrop = order.status === 'IN_PROGRESS' || order.status === 'COMPLETED';
    const hasServerRoute =
      (toDrop && (hasNavDropoff(order) || legacy)) ||
      (order.status === 'ARRIVED' && hasNavDropoff(order)) ||
      ((order.status === 'ACCEPTED' || order.status === 'ARRIVED') && hasNavPickup(order)) ||
      (legacy && order.status === 'SEARCHING');

    if (hasServerRoute) return;

    const phase: TrackingPhase =
      order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? 'to_dropoff' : 'to_pickup';

    const driverLoc = order.driver
      ? { lat: order.driver.currentLat ?? order.pickupLat, lng: order.driver.currentLng ?? order.pickupLng }
      : null;
    const from = driverPos || (phase === 'to_pickup' && order.driver ? driverLoc : null);
    if (!from) {
      setRouteCoords([]);
      return;
    }

    const to =
      phase === 'to_pickup'
        ? { lat: order.pickupLat, lng: order.pickupLng }
        : { lat: order.dropoffLat, lng: order.dropoffLng };
    void fetchRouteAlternatives(from, to);
  }, [order, driverPos, fetchRouteAlternatives]);

  const cancelOrder = useCallback(() => {
    if (!orderId) return;
    Alert.alert('Скасувати замовлення?', 'Після скасування замовлення буде закрито.', [
      { text: 'Ні', style: 'cancel' },
      {
        text: 'Скасувати',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/orders/${orderId}`, { status: 'CANCELLED' });
            await fetchOrder();
          } catch (e) {
            Alert.alert('Помилка', (e as Error).message);
          }
        },
      },
    ]);
  }, [orderId, fetchOrder]);

  const submitComplaint = async () => {
    const t = complaintText.trim();
    if (t.length < 3) {
      Alert.alert('Увага', 'Опишіть суть скарги (мінімум 3 символи).');
      return;
    }
    if (!orderId) return;
    setComplaintSending(true);
    try {
      await api.post('/complaints', { orderId, subjectText: t });
      Alert.alert('Дякуємо', 'Скаргу передано підтримці.');
      setComplaintOpen(false);
      setComplaintText('');
    } catch (e) {
      Alert.alert('Помилка', (e as Error).message);
    } finally {
      setComplaintSending(false);
    }
  };

  if (!orderId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Відсутній ID замовлення</Text>
        <Button onPress={() => navigation.navigate('Order', { screen: 'CreateOrder' })}>На головну</Button>
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
        <Button onPress={() => navigation.navigate('Order', { screen: 'CreateOrder' })}>На головну</Button>
      </View>
    );
  }

  const phase: TrackingPhase =
    order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? 'to_dropoff' : 'to_pickup';

  const statusLabels: Record<string, string> = {
    SEARCHING: 'Пошук водія...',
    ACCEPTED: 'Водій їде до вас',
    ARRIVED: 'Водій на місці',
    IN_PROGRESS: 'Їдемо до пункту призначення',
    COMPLETED: 'Поїздку завершено',
    CANCELLED: 'Скасовано',
  };

  const sheetHeight = Math.min(height * 0.36, 300);
  const isWaitingForRoute =
    order.status === 'SEARCHING' || (order.status === 'ACCEPTED' && !hasNavPickup(order));
  const mapBottomOverlayPx = Math.round(sheetHeight);

  const showTripChat =
    !!order.driver &&
    !['SEARCHING', 'CANCELLED'].includes(order.status);
  const chatCanSend = ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(order.status);

  return (
    <View style={styles.container}>
      <View style={[styles.mapFullScreen, { paddingTop: insets.top }]}>
        {isWaitingForRoute ? (
          <View style={styles.waitingOverlay}>
            <MaterialCommunityIcons name="taxi" size={56} color={colors.primary} />
            <ActivityIndicator size="large" color={colors.primary} style={styles.waitingSpinner} />
            <Text style={styles.waitingTitle}>
              {order.status === 'SEARCHING' ? 'Шукаємо водія…' : 'Водій підтверджує маршрут…'}
            </Text>
            <Text style={styles.waitingHint}>
              {order.status === 'SEARCHING'
                ? 'Зачекайте, найближчий водій отримає ваше замовлення.'
                : 'Щойно маршрут збережеться, на карті з’явиться рух до вас.'}
            </Text>
          </View>
        ) : (
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
        )}
      </View>

      <View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeadRow}>
            <View style={styles.sheetHeadText}>
              <Text style={styles.status}>{statusLabels[order.status] ?? order.status}</Text>
              {order.driver ? (
                <Text style={styles.driverInfo} numberOfLines={1}>
                  {order.driver.user?.fullName}
                  {order.driver.vehicle?.model ? ` · ${order.driver.vehicle.model}` : ''}
                </Text>
              ) : null}
            </View>
            <View style={styles.sheetHeadActions}>
              {order.status !== 'CANCELLED' ? (
                <Pressable
                  style={styles.iconGhost}
                  onPress={() => setComplaintOpen(true)}
                  accessibilityLabel="Скарга"
                >
                  <MaterialCommunityIcons name="flag-outline" size={20} color={colors.onBackground} />
                </Pressable>
              ) : null}
              {showTripChat && orderId ? (
                <>
                  <Pressable
                    style={styles.iconGhost}
                    onPress={() => setChatOpen(true)}
                    accessibilityLabel="Чат з водієм"
                  >
                    <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.onBackground} />
                  </Pressable>
                  {order.driver?.user?.phone ? (
                    <Pressable
                      style={styles.iconGhost}
                      onPress={() => dialPeerPhone(order.driver?.user?.phone)}
                      accessibilityLabel="Подзвонити водію"
                    >
                      <MaterialCommunityIcons name="phone-outline" size={20} color={colors.onBackground} />
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </View>
          </View>

          <Text style={styles.routeLine} numberOfLines={2}>
            {shortOrderAddress(order.pickupAddress)} → {shortOrderAddress(order.dropoffAddress)}
          </Text>
          <Text style={styles.price}>{String(order.totalPrice)} грн</Text>

          {['SEARCHING', 'ACCEPTED', 'ARRIVED'].includes(order.status) && (
            <Button mode="outlined" textColor={colors.error} onPress={cancelOrder} style={styles.button}>
              Скасувати замовлення
            </Button>
          )}

          {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Order', { screen: 'CreateOrder' })}
              style={styles.button}
              buttonColor={colors.primary}
            >
              Нове замовлення
            </Button>
          )}
        </View>
      </View>

      {orderId && showTripChat ? (
        <TripChatModal
          visible={chatOpen}
          onClose={() => setChatOpen(false)}
          orderId={orderId}
          socket={socketRef.current}
          myRole="CLIENT"
          canSend={chatCanSend}
          emptyHint="Ще немає повідомлень. Напишіть водію."
        />
      ) : null}

      {orderId && order.status === 'COMPLETED' ? (
        <TripReviewModal
          visible={reviewOpen}
          orderId={orderId}
          title="Оцініть поїздку"
          subjectName={order.driver?.user?.fullName ?? 'Водій'}
          onDone={finishAfterReview}
        />
      ) : null}

      <Modal visible={complaintOpen} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.complaintBackdrop}
        >
          <View style={styles.complaintSheet}>
            <Text style={styles.complaintTitle}>Скарга</Text>
            <TextInput
              value={complaintText}
              onChangeText={setComplaintText}
              placeholder="Опишіть проблему"
              placeholderTextColor={colors.onSurfaceMuted}
              multiline
              style={styles.complaintInput}
            />
            <View style={styles.complaintActions}>
              <Button mode="outlined" onPress={() => setComplaintOpen(false)} textColor={colors.onBackground}>
                Скасувати
              </Button>
              <Button
                mode="contained"
                onPress={() => void submitComplaint()}
                loading={complaintSending}
                disabled={complaintSending}
                buttonColor={colors.primary}
              >
                Надіслати
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
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
  mapFullScreen: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  waitingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.backgroundMuted,
  },
  waitingSpinner: {
    marginTop: spacing.md,
  },
  waitingTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
  },
  waitingHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
    maxWidth: 320,
  },
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
  sheetContent: {
    paddingHorizontal: spacing.md,
    flex: 1,
  },
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
  driverInfo: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
  },
  routeLine: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },
  complaintBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  complaintSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  complaintTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  complaintInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    textAlignVertical: 'top',
    fontFamily: typography.fontFamily.regular,
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  complaintActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
