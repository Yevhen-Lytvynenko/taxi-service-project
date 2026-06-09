import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import api from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { colors, spacing, radius, typography } from '../theme';

type TripRow = {
  id: string;
  finishedAt: string | null;
  driverEarningAmount: string | number | null;
  totalPrice: string | number;
  distanceKm?: number | null;
  pickupAddress: string;
  dropoffAddress: string;
};

type EarningsPayload = {
  from: string;
  to: string;
  tripCount: number;
  totalDriverEarning: number;
  trips: TripRow[];
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DriverEarningsScreen() {
  const [preset, setPreset] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<EarningsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - preset);
    try {
      const res = await api.get(`/driver/me/earnings?from=${isoDay(from)}&to=${isoDay(to)}`);
      setData(res.data as EarningsPayload);
    } catch (e) {
      Alert.alert('Помилка', (e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [preset]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const trips = data?.trips ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.segment}>
        {([7, 30, 90] as const).map((d) => (
          <Pressable
            key={d}
            style={[styles.segmentBtn, preset === d && styles.segmentBtnActive]}
            onPress={() => setPreset(d)}
          >
            <Text style={[styles.segmentText, preset === d && styles.segmentTextActive]}>{d} дн.</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryBig}>{Number(data?.totalDriverEarning ?? 0).toFixed(2)} грн</Text>
        <Text style={styles.summarySub}>Нараховано за період · поїздок: {data?.tripCount ?? 0}</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Немає завершених поїздок у цьому періоді</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardDate}>
              {item.finishedAt ? new Date(item.finishedAt).toLocaleString('uk-UA') : '—'}
            </Text>
            <Text style={styles.earn}>{String(item.driverEarningAmount ?? '0')} грн</Text>
            <Text style={styles.addr}>{shortOrderAddress(item.pickupAddress)}</Text>
            <Text style={styles.addr}>{shortOrderAddress(item.dropoffAddress)}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  segmentBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: typography.fontFamily.medium, color: colors.onSurfaceMuted },
  segmentTextActive: { color: colors.onBackground, fontFamily: typography.fontFamily.semiBold },
  summary: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  summaryBig: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: colors.onBackground,
  },
  summarySub: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  list: { padding: spacing.md, paddingBottom: 48 },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDate: { fontSize: 11, color: colors.onSurfaceMuted },
  earn: { fontSize: typography.fontSize.lg, fontWeight: '700', marginTop: 6 },
  addr: { fontSize: 13, marginTop: 4, color: colors.onBackground },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.onSurfaceMuted },
});
