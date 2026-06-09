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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import api from '../api/axios';
import { shortOrderAddress } from '../utils/shortOrderAddress';
import { colors, spacing, radius, typography } from '../theme';

type SavedRoute = {
  id: string;
  name: string;
  pickupAddress: string;
  dropoffAddress: string;
};

export function SavedRoutesScreen() {
  const [rows, setRows] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/driver/saved-routes');
      setRows(res.data as SavedRoute[]);
    } catch (e) {
      Alert.alert('Помилка', (e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    Alert.alert('Видалити маршрут?', '', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/driver/saved-routes/${id}`);
            await load();
          } catch (e) {
            Alert.alert('Помилка', (e as Error).message);
          }
        },
      },
    ]);
  };

  const submit = async () => {
    const n = name.trim();
    const p = pickup.trim();
    const d = dropoff.trim();
    if (n.length < 1 || p.length < 3 || d.length < 3) {
      Alert.alert('Заповніть поля', 'Назва та адреси (мін. 3 символи).');
      return;
    }
    setSaving(true);
    try {
      await api.post('/driver/saved-routes', { name: n, pickupAddress: p, dropoffAddress: d });
      setModalOpen(false);
      setName('');
      setPickup('');
      setDropoff('');
      await load();
    } catch (e) {
      Alert.alert('Помилка', (e as Error).message);
    } finally {
      setSaving(false);
    }
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
      <Pressable style={styles.addBtn} onPress={() => setModalOpen(true)}>
        <Text style={styles.addBtnText}>+ Додати маршрут</Text>
      </Pressable>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Ще немає збережених маршрутів</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.addr}>{shortOrderAddress(item.pickupAddress)}</Text>
            <Text style={styles.addr}>{shortOrderAddress(item.dropoffAddress)}</Text>
            <Pressable onPress={() => void remove(item.id)} style={styles.del}>
              <Text style={styles.delText}>Видалити</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Новий збережений маршрут</Text>
            <TextInput
              placeholder="Назва"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor={colors.onSurfaceMuted}
            />
            <TextInput
              placeholder="Адреса подачі"
              value={pickup}
              onChangeText={setPickup}
              style={styles.input}
              placeholderTextColor={colors.onSurfaceMuted}
            />
            <TextInput
              placeholder="Адреса призначення"
              value={dropoff}
              onChangeText={setDropoff}
              style={styles.input}
              placeholderTextColor={colors.onSurfaceMuted}
            />
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setModalOpen(false)} textColor={colors.onBackground}>
                Закрити
              </Button>
              <Button mode="contained" onPress={() => void submit()} loading={saving} buttonColor={colors.primary}>
                Зберегти
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addBtnText: { fontFamily: typography.fontFamily.semiBold, color: colors.onPrimary },
  list: { paddingHorizontal: spacing.md, paddingBottom: 48 },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md, marginBottom: 6 },
  addr: { fontSize: 13, color: colors.onBackground, marginTop: 2 },
  del: { alignSelf: 'flex-end', marginTop: spacing.sm },
  delText: { color: colors.error, fontFamily: typography.fontFamily.medium },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.onSurfaceMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.onBackground,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
