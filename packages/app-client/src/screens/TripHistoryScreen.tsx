import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  driver?: { user?: { id: string; fullName: string } };
  reviews?: ReviewMini[];
};

type PeriodKey = '7' | '30' | '90' | 'all';

export const TripHistoryScreen = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('30');
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

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const days = period === '7' ? 7 : period === '30' ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
  }, [orders, period]);

  const stats = useMemo(() => {
    const completed = filteredOrders.filter((o) => o.status === 'COMPLETED');
    const trips = completed.length;
    const spent = completed.reduce((s, o) => s + Number(o.totalPrice), 0);
    return { trips, spent };
  }, [filteredOrders]);

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
      item.driver?.user?.id &&
      myId &&
      !(item.reviews ?? []).some((r) => r.authorId === myId);
    const driverPeerId = item.driver?.user?.id;

    return (
      <View style={styles.card}>
        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString('uk-UA')}</Text>
        <Text style={styles.status}>{item.status}</Text>
        <Text style={styles.addr}>{shortOrderAddress(item.pickupAddress)}</Text>
        <Text style={styles.addr}>{shortOrderAddress(item.dropoffAddress)}</Text>
        <Text style={styles.price}>{String(item.totalPrice)} грн</Text>
        {item.driver?.user && (
          <Text style={styles.driver}>Водій: {item.driver.user.fullName}</Text>
        )}
        {canRate && (
          <View style={styles.row}>
            <Text style={styles.rateLabel}>Оцінка:</Text>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} style={styles.starBtn} onPress={() => void submitReview(item.id, s)}>
                <Text style={styles.starText}>{s}★</Text>
              </Pressable>
            ))}
          </View>
        )}
        {item.status === 'COMPLETED' && driverPeerId && (
          <View style={styles.row}>
            <Pressable style={styles.smallBtn} onPress={() => void addContact(driverPeerId, 'FAVORITE')}>
              <Text style={styles.smallBtnText}>В обране</Text>
            </Pressable>
            <Pressable style={styles.smallBtnDanger} onPress={() => void addContact(driverPeerId, 'BLOCKED')}>
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
      <View style={styles.periodRow}>
        {(['7', '30', '90', 'all'] as PeriodKey[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>
              {p === 'all' ? 'Усі' : `${p} дн.`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statsLine}>
          Завершено за період: <Text style={styles.statsEm}>{stats.trips}</Text>
        </Text>
        <Text style={styles.statsLine}>
          Сума поїздок: <Text style={styles.statsEm}>{stats.spent.toFixed(0)} грн</Text>
        </Text>
      </View>
      <FlatList
        data={filteredOrders}
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
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  periodChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
  },
  periodChipTextActive: {
    color: colors.onBackground,
    fontFamily: typography.fontFamily.semiBold,
  },
  statsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsLine: {
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  statsEm: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, paddingBottom: 48 },
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
