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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import api from '../api/axios';
import { colors, spacing, radius, typography } from '../theme';

type SavedPlace = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export function SavedPlacesScreen() {
  const [rows, setRows] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/saved-places');
      setRows(res.data as SavedPlace[]);
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
    Alert.alert('Видалити адресу?', '', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/saved-places/${id}`);
            await load();
          } catch (e) {
            Alert.alert('Помилка', (e as Error).message);
          }
        },
      },
    ]);
  };

  const submit = async () => {
    const l = label.trim();
    const a = address.trim();
    if (l.length < 1 || a.length < 3) {
      Alert.alert('Заповніть поля', 'Назва та адреса пошуку.');
      return;
    }
    setSaving(true);
    try {
      const geoRes = await api.get('/geocode', { params: { address: a } });
      const g = geoRes.data as { lat: number; lng: number; displayName: string };
      await api.post('/saved-places', {
        label: l,
        address: g.displayName || a,
        lat: g.lat,
        lng: g.lng,
      });
      setModalOpen(false);
      setLabel('');
      setAddress('');
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
        <Text style={styles.addBtnText}>+ Додати адресу</Text>
      </Pressable>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Збережених адрес поки немає</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.addr}>{item.address}</Text>
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
            <Text style={styles.modalTitle}>Нова збережена адреса</Text>
            <TextInput
              placeholder="Назва (Дім, Робота…)"
              value={label}
              onChangeText={setLabel}
              style={styles.input}
              placeholderTextColor={colors.onSurfaceMuted}
            />
            <TextInput
              placeholder="Адреса для пошуку"
              value={address}
              onChangeText={setAddress}
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
  addr: { fontSize: 13, color: colors.onBackground },
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
