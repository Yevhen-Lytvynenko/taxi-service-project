import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../api/axios';
import { colors, spacing, radius, typography } from '../theme';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { fullName: string; role: string };
  order: { pickupAddress: string; dropoffAddress: string };
};

export const ReviewsAboutMeScreen = () => {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const { data } = await api.get('/reviews/about-me');
      setRows(data as ReviewRow[]);
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
        data={rows}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>{loadError ? 'Помилка завантаження' : 'Поки немає відгуків про вас'}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rating}>
              {'★'.repeat(Math.max(0, Math.min(5, Math.round(item.rating ?? 0))))}
              {'\u2606'.repeat(Math.max(0, 5 - Math.min(5, Math.round(item.rating ?? 0))))}
            </Text>
            <Text style={styles.meta}>
              {item.author.fullName} · {item.author.role}
            </Text>
            {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
            <Text style={styles.orderHint} numberOfLines={2}>
              {item.order.pickupAddress} → {item.order.dropoffAddress}
            </Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('uk-UA')}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  rating: { fontSize: 16, color: '#b8860b' },
  meta: { fontSize: 13, color: colors.onSurfaceMuted, marginTop: 4 },
  comment: { fontSize: 14, marginTop: 8, color: colors.onBackground },
  orderHint: { fontSize: 12, color: '#888', marginTop: 8 },
  date: { fontSize: 11, color: '#aaa', marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 40, color: colors.onSurfaceMuted },
});
