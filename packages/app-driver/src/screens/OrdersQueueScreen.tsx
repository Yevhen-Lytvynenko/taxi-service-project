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
import io, { Socket } from 'socket.io-client';
import api, { API_BASE } from '../api/axios';

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
        Alert.alert('Успіх', 'Замовлення прийнято');
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
        <Text style={styles.addressLabel}>Звідки</Text>
        <Text style={styles.address}>{item.pickupAddress}</Text>
        <Text style={styles.addressLabel}>Куди</Text>
        <Text style={styles.address}>{item.dropoffAddress}</Text>
        <Text style={styles.price}>{price} грн</Text>
        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={() => handleAccept(item.id)}
            disabled={isAccepting}
            loading={isAccepting}
            style={styles.acceptBtn}
          >
            Взяти
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleReject(item.id)}
            textColor="#ffd451"
            style={styles.rejectBtn}
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
        <ActivityIndicator size="large" color="#ffd451" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Strum</Text>
        <Text style={styles.subtitle}>Черга замовлень</Text>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Немає доступних замовлень</Text>
        }
      />
      <Button
        mode="text"
        onPress={() => navigation.navigate('Profile')}
        textColor="#ffd451"
        style={styles.profileLink}
      >
        Профіль
      </Button>
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
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
  },
  logo: {
    color: '#ffd451',
    fontWeight: 'bold',
    fontSize: 28,
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 2,
    marginBottom: 12,
  },
  addressLabel: {
    color: '#666666',
    fontSize: 12,
    marginTop: 8,
  },
  address: {
    color: '#1a1a1a',
    fontSize: 16,
    marginBottom: 4,
  },
  price: {
    color: '#ffd451',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptBtn: {
    flex: 1,
  },
  rejectBtn: {
    flex: 1,
    borderColor: '#ffd451',
  },
  empty: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 40,
  },
  profileLink: {
    marginBottom: 24,
  },
});
