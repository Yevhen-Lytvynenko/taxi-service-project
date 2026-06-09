import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  ListRenderItem,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';
import api, { getApiBase } from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { colors, spacing, radius, typography } from '../theme';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface Order {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  preferredDriverUserId?: string | null;
  distanceKm?: number;
  totalPrice: string | number;
  status: string;
  client?: { fullName: string; phone?: string };
  createdAt?: string;
}

interface OrdersQueueScreenProps {
  navigation: { navigate: (name: string, params?: object) => void };
}

export const OrdersQueueScreen = ({ navigation }: OrdersQueueScreenProps) => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const sortedOrders = useMemo(() => {
    const list = [...orders];
    const distKm = (o: Order): number | null => {
      if (
        driverLat == null ||
        driverLng == null ||
        o.pickupLat == null ||
        o.pickupLng == null ||
        Number.isNaN(o.pickupLat) ||
        Number.isNaN(o.pickupLng)
      ) {
        return null;
      }
      return haversineKm(driverLat, driverLng, o.pickupLat, o.pickupLng);
    };
    list.sort((a, b) => {
      const ra =
        myUserId && a.preferredDriverUserId && a.preferredDriverUserId === myUserId ? 1 : 0;
      const rb =
        myUserId && b.preferredDriverUserId && b.preferredDriverUserId === myUserId ? 1 : 0;
      if (ra !== rb) return rb - ra;
      const da = distKm(a);
      const db = distKm(b);
      if (da != null && db != null) return da - db;
      if (da != null) return -1;
      if (db != null) return 1;
      return 0;
    });
    return list;
  }, [orders, driverLat, driverLng, myUserId]);

  const loadDriverAndOrders = useCallback(async () => {
    try {
      const meRes = await api.get('/auth/me');
      const user = meRes.data as {
        id: string;
        driverProfile?: {
          id: string;
          currentLat?: number | null;
          currentLng?: number | null;
        };
      };
      const dId = user.driverProfile?.id;
      if (!dId) {
        Alert.alert('Помилка', 'Профіль водія не знайдено');
        return;
      }
      setMyUserId(user.id);
      setDriverLat(user.driverProfile?.currentLat ?? null);
      setDriverLng(user.driverProfile?.currentLng ?? null);
      setDriverId(dId);

      await api.patch('/driver/me/status', { status: 'ONLINE' });

      const ordersRes = await api.get('/orders?status=SEARCHING');
      const list = (ordersRes.data as Order[]) || [];
      setOrders(list);
    } catch (err) {
      Alert.alert('Помилка', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDriverAndOrders();
    } finally {
      setRefreshing(false);
    }
  }, [loadDriverAndOrders]);

  useEffect(() => {
    loadDriverAndOrders();
  }, [loadDriverAndOrders]);

  useEffect(() => {
    if (!driverId) return;

    const socket = io(getApiBase(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', `driver_${driverId}`);
    });

    socket.on('new_order', (order: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        const totalPrice =
          typeof order.totalPrice === 'string' ? order.totalPrice : String(order.totalPrice);
        return [{ ...order, totalPrice }, ...prev];
      });
    });

    socket.on('order_cancelled', (payload: { orderId?: string }) => {
      const oid = payload?.orderId;
      if (!oid) return;
      setOrders((prev) => prev.filter((o) => o.id !== oid));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [driverId]);

  const handleAccept = useCallback(
    async (orderId: string) => {
      if (!driverId) return;
      setAcceptingId(orderId);
      try {
        await api.put(`/orders/${orderId}`, { status: 'ACCEPTED', driverId });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        navigation.navigate('ActiveOrder', { orderId });
      } catch (err) {
        Alert.alert('Помилка', (err as Error).message);
      } finally {
        setAcceptingId(null);
      }
    },
    [driverId, navigation]
  );

  const handleReject = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const handleAcceptNearest = useCallback(() => {
    const first = sortedOrders[0];
    if (!first) {
      Alert.alert('Черга порожня', 'Немає доступних замовлень.');
      return;
    }
    void handleAccept(first.id);
  }, [sortedOrders, handleAccept]);

  const formatPrice = (p: Order['totalPrice']) => {
    if (typeof p === 'string') return p;
    if (typeof p === 'number') return String(p);
    const o = p as { toString?: () => string };
    return o?.toString?.() ?? '0';
  };

  const distanceLabel = (item: Order): string | null => {
    if (
      driverLat == null ||
      driverLng == null ||
      item.pickupLat == null ||
      item.pickupLng == null
    ) {
      return null;
    }
    return `${haversineKm(driverLat, driverLng, item.pickupLat, item.pickupLng).toFixed(1)} км`;
  };

  const renderOrder: ListRenderItem<Order> = ({ item }) => {
    const price = formatPrice(item.totalPrice);
    const isAccepting = acceptingId === item.id;
    const recommended =
      !!myUserId && !!item.preferredDriverUserId && item.preferredDriverUserId === myUserId;
    const dist = distanceLabel(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.price}>{price} грн</Text>
          <View style={styles.cardTopRight}>
            {recommended ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Для вас</Text>
              </View>
            ) : null}
            {dist ? <Text style={styles.dist}>{dist}</Text> : null}
            {item.client?.fullName || item.client?.phone ? (
              <Text style={styles.client} numberOfLines={1}>
                {item.client.fullName || item.client.phone}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.routeRow}>
          <View style={styles.dotPickup} />
          <Text style={styles.routeText} numberOfLines={2}>
            {shortOrderAddress(item.pickupAddress)}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <View style={styles.dotDrop} />
          <Text style={styles.routeText} numberOfLines={2}>
            {shortOrderAddress(item.dropoffAddress)}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.btnPrimary, isAccepting && styles.btnDisabled]}
            onPress={() => void handleAccept(item.id)}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Прийняти</Text>
            )}
          </Pressable>
          <Pressable style={styles.btnGhost} onPress={() => handleReject(item.id)}>
            <Text style={styles.btnGhostText}>Приховати</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Замовлення</Text>
        <Pressable style={styles.nearestBtn} onPress={() => void handleAcceptNearest()}>
          <MaterialCommunityIcons name="navigation-variant" size={18} color={colors.onPrimary} />
          <Text style={styles.nearestBtnText}>Найближче</Text>
        </Pressable>
      </View>
      {driverLat == null || driverLng == null ? (
        <Text style={styles.hint}>
          Увімкніть передачу координат під час поїздки — список сортується за відстанню до подачі.
        </Text>
      ) : null}
      <FlatList
        data={sortedOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="inbox-outline" size={48} color={colors.onSurfaceMuted} />
            <Text style={styles.emptyText}>Немає замовлень</Text>
          </View>
        }
      />
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
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.onBackground,
    flex: 1,
  },
  nearestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  nearestBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.onPrimary,
  },
  hint: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    fontSize: 12,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTopRight: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 4,
  },
  badge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
    fontFamily: typography.fontFamily.semiBold,
  },
  dist: {
    fontSize: 12,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.medium,
  },
  price: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.onBackground,
  },
  client: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    textAlign: 'right',
    maxWidth: '100%',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  dotDrop: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onSurfaceMuted,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  routeText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.onBackground,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.onPrimary,
  },
  btnGhost: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  btnGhostText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyText: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    marginTop: spacing.sm,
  },
});
