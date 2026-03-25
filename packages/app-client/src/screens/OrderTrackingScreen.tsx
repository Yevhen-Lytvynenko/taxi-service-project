import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, useWindowDimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import io, { Socket } from 'socket.io-client';
import api, { API_BASE } from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { OrderTrackingMap, TrackingPhase } from '../components/OrderTrackingMap';

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
  driver?: {
    id: string;
    currentLat?: number | null;
    currentLng?: number | null;
    user?: { fullName: string };
    vehicle?: { model: string };
  };
}

interface OrderTrackingScreenProps {
  navigation: { navigate: (name: string) => void };
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
  const socketRef = useRef<Socket | null>(null);
  const lastDriverMovedRef = useRef<number>(0);
  const DRIVER_MOVED_THROTTLE_MS = 2500;

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
      if (o?.driver?.id && socketRef.current) {
        socketRef.current.emit('join_room', `driver_tracking_${o.driver.id}`);
      }
      return o;
    } catch {
      setError('Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchRoute = useCallback(
    async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
      try {
        const fromStr = `${from.lat},${from.lng}`;
        const toStr = `${to.lat},${to.lng}`;
        const { data } = await api.get(`/route?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`);
        const coords = (data as { coordinates?: Array<[number, number]> }).coordinates;
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

  useEffect(() => {
    if (!orderId) return;

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', `order_${orderId}`);
      if (order?.driver?.id) {
        socket.emit('join_room', `driver_tracking_${order.driver.id}`);
      }
    });

    socket.on('order_status_changed', async (payload: { status: string }) => {
      setOrder((prev) => (prev ? { ...prev, status: payload.status } : null));
      const updated = await fetchOrder();
      if (updated?.driver?.id && socketRef.current) {
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, order?.driver?.id]);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'CANCELLED') {
      setRouteCoords([]);
      return;
    }

    const phase: TrackingPhase =
      order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? 'to_dropoff' : 'to_pickup';

    const driverLoc = order.driver ? { lat: order.driver.currentLat ?? order.pickupLat, lng: order.driver.currentLng ?? order.pickupLng } : null;
    const from = driverPos || (phase === 'to_pickup' && order.driver ? driverLoc : null);
    if (!from) {
      setRouteCoords([]);
      return;
    }

    const to = phase === 'to_pickup' ? { lat: order.pickupLat, lng: order.pickupLng } : { lat: order.dropoffLat, lng: order.dropoffLng };
    fetchRoute(from, to);
  }, [order, driverPos, fetchRoute]);

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
        <ActivityIndicator size="large" color="#ffd451" />
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

  const sheetHeight = Math.min(height * 0.42, 320);

  return (
    <View style={styles.container}>
      <View style={[styles.mapFullScreen, { paddingTop: insets.top }]}>
        <OrderTrackingMap
          driverPos={driverPos}
          pickup={{ lat: order.pickupLat, lng: order.pickupLng }}
          dropoff={{ lat: order.dropoffLat, lng: order.dropoffLng }}
          routeCoordinates={routeCoords}
          phase={phase}
          style={styles.map}
        />
      </View>

      <View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetContent}>
          <Text style={styles.status}>{statusLabels[order.status] ?? order.status}</Text>
          {order.driver && (
            <Text style={styles.driverInfo}>
              {order.driver.user?.fullName} · {order.driver.vehicle?.model ?? 'Таксі'}
            </Text>
          )}
          <Text style={styles.addressLabel}>Підбір</Text>
          <Text style={styles.address}>{shortOrderAddress(order.pickupAddress)}</Text>
          <Text style={styles.addressLabel}>Висадка</Text>
          <Text style={styles.address}>{shortOrderAddress(order.dropoffAddress)}</Text>
          <Text style={styles.price}>{String(order.totalPrice)} грн</Text>

          {['SEARCHING', 'ACCEPTED', 'ARRIVED'].includes(order.status) && (
            <Button mode="outlined" textColor="#b71c1c" onPress={cancelOrder} style={styles.button}>
              Скасувати замовлення
            </Button>
          )}

          {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Order', { screen: 'CreateOrder' })}
              style={styles.button}
            >
              Новий замовлення
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  error: {
    color: '#666',
    fontSize: 16,
    marginBottom: 16,
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
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    paddingHorizontal: 20,
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd451',
    marginBottom: 4,
  },
  driverInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  address: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd451',
    marginTop: 12,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
});
