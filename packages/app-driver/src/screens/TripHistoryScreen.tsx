import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import api from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { colors, spacing, radius, typography } from '../theme';

type ReviewMini = { id: string; authorId: string; rating: number; subjectUserId: string };
type OrderRow = {
  id: string;
  status: string;
  totalPrice: string | number;
  pickupAddress: string;
  dropoffAddress: string;
  createdAt: string;
  client?: { id: string; fullName: string };
  reviews?: ReviewMini[];
};

export const TripHistoryScreen = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const [meRes, ordRes] = await Promise.all([api.get('/auth/me'), api.get('/orders')]);
      setMyId((meRes.data as { id: string }).id);
      setOrders(ordRes.data as OrderRow[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = async (orderId: string, rating: number) => {
    try {
      await api.post('/reviews', { orderId, rating, comment: '' });
      Alert.alert('Дякуємо', 'Ваш відгук збережено');
      await load();
    } catch (e) {
      Alert.alert('Помилка', (e as Error).message);
    }
  };

  const addContact = async (peerId: string, kind: 'FAVORITE' | 'BLOCKED') => {
    try {
      await api.post('/contacts', { peerId, kind });
      Alert.alert('Готово', kind === 'FAVORITE' ? 'Додано в обране' : 'Користувача заблоковано');
    } catch (e) {
      Alert.alert('Помилка', (e as Error).message);
    }
  };

  const renderItem = ({ item }: { item: OrderRow }) => {
    const canRate =
      item.status === 'COMPLETED' &&
      item.client?.id &&
      myId &&
      !(item.reviews ?? []).some((r) => r.authorId === myId);
    const clientPeerId = item.client?.id;

    return (
      <View style={styles.card}>
        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString('uk-UA')}</Text>
        <Text style={styles.status}>{item.status}</Text>
        <Text style={styles.addr}>{shortOrderAddress(item.pickupAddress)}</Text>
        <Text style={styles.addr}>{shortOrderAddress(item.dropoffAddress)}</Text>
        <Text style={styles.price}>{String(item.totalPrice)} грн</Text>
        {item.client && <Text style={styles.driver}>Клієнт: {item.client.fullName}</Text>}
        {canRate && (
          <View style={styles.row}>
            <Text style={styles.rateLabel}>Оцінка клієнта:</Text>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} style={styles.starBtn} onPress={() => void submitReview(item.id, s)}>
                <Text style={styles.starText}>{s}★</Text>
              </Pressable>
            ))}
          </View>
        )}
        {item.status === 'COMPLETED' && clientPeerId && (
          <View style={styles.row}>
            <Pressable style={styles.smallBtn} onPress={() => void addContact(clientPeerId, 'FAVORITE')}>
              <Text style={styles.smallBtnText}>В обране</Text>
            </Pressable>
            <Pressable style={styles.smallBtnDanger} onPress={() => void addContact(clientPeerId, 'BLOCKED')}>
              <Text style={styles.smallBtnText}>Заблокувати</Text>
            </Pressable>
          </View>
        )}
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
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>{loadError ? 'Помилка завантаження. Потягніть вниз для оновлення' : 'Немає замовлень'}</Text>}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDate: { fontSize: 12, color: colors.onSurfaceMuted, fontFamily: typography.fontFamily.regular },
  status: { fontWeight: '700', color: colors.primary, marginTop: 4 },
  addr: { fontSize: 14, color: colors.onBackground, marginTop: 4, fontFamily: typography.fontFamily.regular },
  price: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  driver: { fontSize: 13, color: '#555', marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10, gap: 6 },
  rateLabel: { width: '100%', fontSize: 12, color: colors.onSurfaceMuted },
  starBtn: { padding: 6, backgroundColor: '#fff8e1', borderRadius: 8 },
  starText: { fontSize: 14, color: '#b8860b' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e8f5e9', borderRadius: 8, marginRight: 8 },
  smallBtnDanger: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ffebee', borderRadius: 8 },
  smallBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
  empty: { textAlign: 'center', marginTop: 40, color: colors.onSurfaceMuted },
});
