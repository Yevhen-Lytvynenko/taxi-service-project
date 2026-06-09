import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import api from '../api/axios';
import { colors, spacing, radius, typography } from '../theme';

type Peer = {
  id: string;
  fullName: string;
  phone: string;
  rating: number;
  role: string;
  driverProfile?: { vehicle?: { model: string } };
};
type ContactRow = { id: string; kind: string; peer: Peer };

function PeerCard({
  item,
  kind,
  onRemove,
}: {
  item: ContactRow;
  kind: 'FAVORITE' | 'BLOCKED';
  onRemove: (peerId: string, k: 'FAVORITE' | 'BLOCKED') => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.peer.fullName}</Text>
      <Text style={styles.phone}>{item.peer.phone}</Text>
      <Text style={styles.meta}>
        Рейтинг {(item.peer.rating ?? 0).toFixed(1)} · {item.peer.role}
        {item.peer.driverProfile?.vehicle?.model ? ` · ${item.peer.driverProfile.vehicle.model}` : ''}
      </Text>
      <Pressable style={styles.removeBtn} onPress={() => onRemove(item.peer.id, kind)}>
        <Text style={styles.removeText}>Видалити</Text>
      </Pressable>
    </View>
  );
}

export const ContactsScreen = () => {
  const [favorites, setFavorites] = useState<ContactRow[]>([]);
  const [blocked, setBlocked] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      const [fav, blk] = await Promise.all([
        api.get('/contacts', { params: { kind: 'FAVORITE' } }),
        api.get('/contacts', { params: { kind: 'BLOCKED' } }),
      ]);
      setFavorites(fav.data as ContactRow[]);
      setBlocked(blk.data as ContactRow[]);
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

  const remove = (peerId: string, kind: 'FAVORITE' | 'BLOCKED') => {
    Alert.alert('Прибрати зі списку?', '', [
      { text: 'Ні', style: 'cancel' },
      {
        text: 'Так',
        onPress: async () => {
          try {
            await api.delete(`/contacts/${encodeURIComponent(peerId)}?kind=${kind}`);
            await load();
          } catch (e) {
            Alert.alert('Помилка', (e as Error).message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.sectionTitle}>Обране</Text>
      {favorites.length === 0 ? <Text style={styles.emptySmall}>Порожньо</Text> : null}
      {favorites.map((c) => (
        <PeerCard key={c.id} item={c} kind="FAVORITE" onRemove={remove} />
      ))}
      <Text style={styles.sectionTitle}>Заблоковані</Text>
      {blocked.length === 0 ? <Text style={styles.emptySmall}>Порожньо</Text> : null}
      {blocked.map((c) => (
        <PeerCard key={c.id} item={c} kind="BLOCKED" onRemove={remove} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onBackground,
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.semiBold,
  },
  card: {
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '600' },
  phone: { fontSize: 14, color: '#555', marginTop: 4 },
  meta: { fontSize: 12, color: colors.onSurfaceMuted, marginTop: 4 },
  removeBtn: { alignSelf: 'flex-start', marginTop: 8 },
  removeText: { color: '#c62828', fontWeight: '600' },
  emptySmall: { paddingVertical: spacing.sm, color: colors.onSurfaceMuted },
});
