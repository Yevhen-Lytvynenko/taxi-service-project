import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';
import api, { API_BASE } from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { CheckeredStrip } from '../components/CheckeredStrip';
import { colors, spacing, radius, typography } from '../theme';

interface Order {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm?: number;
  totalPrice: string | number;
  status: string;
  client?: { fullName: string };
  createdAt?: string;
}

interface OrdersQueueScreenProps {
  navigation: { navigate: (name: string) => void };
}

export const OrdersQueueScreen = ({ navigation }: OrdersQueueScreenProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const loadDriverAndOrders = useCallback(async () => {
    try {
      const meRes = await api.get('/auth/me');
      const user = meRes.data as { driverProfile?: { id: string } };
      const dId = user.driverProfile?.id;
      if (!dId) {
        Alert.alert('Помилка', 'Профіль водія не знайдено');
        return;
      }
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

  useEffect(() => {
    loadDriverAndOrders();
  }, [loadDriverAndOrders]);

  useEffect(() => {
    if (!driverId) return;

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
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
    [driverId]
  );

  const handleReject = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const formatPrice = (p: Order['totalPrice']) => {
    if (typeof p === 'string') return p;
    if (typeof p === 'number') return String(p);
    const o = p as { toString?: () => string };
    return o?.toString?.() ?? '0';
  };

  const renderOrder: ListRenderItem<Order> = ({ item }) => {
    const price = formatPrice(item.totalPrice);
    const isAccepting = acceptingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} style={styles.addrIcon} />
          <View style={styles.addrBlock}>
            <Text style={styles.addressLabel}>Звідки</Text>
            <Text style={styles.address}>{shortOrderAddress(item.pickupAddress)}</Text>
          </View>
        </View>
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker-check" size={18} color={colors.primary} style={styles.addrIcon} />
          <View style={styles.addrBlock}>
            <Text style={styles.addressLabel}>Куди</Text>
            <Text style={styles.address}>{shortOrderAddress(item.dropoffAddress)}</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <MaterialCommunityIcons name="cash" size={20} color={colors.primary} />
          <Text style={styles.price}>{price} грн</Text>
        </View>
        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={() => handleAccept(item.id)}
            disabled={isAccepting}
            loading={isAccepting}
            style={styles.acceptBtn}
            labelStyle={styles.btnLabel}
            icon="check"
          >
            Взяти
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleReject(item.id)}
            textColor={colors.primary}
            style={styles.rejectBtn}
            labelStyle={styles.btnLabel}
            icon="close"
          >
            Відхилити
          </Button>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Strum</Text>
        <Text style={styles.subtitle}>Черга замовлень</Text>
        <CheckeredStrip height={6} />
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={64} color={colors.onSurfaceMuted} />
            <Text style={styles.emptyText}>Немає доступних замовлень</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  logo: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
  },
  subtitle: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  addrIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  addrBlock: {
    flex: 1,
  },
  addressLabel: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  address: {
    color: colors.onBackground,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  price: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    marginLeft: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    flex: 1,
    borderRadius: radius.md,
  },
  rejectBtn: {
    flex: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
  btnLabel: {
    fontFamily: typography.fontFamily.semiBold,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  emptyText: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    marginTop: spacing.md,
  },
});
