import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { colors, spacing, radius, typography } from '../theme';

type Props = {
  navigation: { goBack: () => void };
};

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function EditProfileScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data as {
        id: string;
        fullName: string;
        email?: string | null;
        avatarUrl?: string | null;
      };
      setUserId(u.id);
      setFullName(u.fullName);
      setEmail(u.email ?? '');
      setAvatarUri(u.avatarUrl ?? null);
    } catch {
      Alert.alert('Помилка', 'Не вдалося завантажити профіль');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Доступ', 'Надайте доступ до галереї для вибору фото профілю.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 480 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (manipulated.base64) {
        setAvatarUri(`data:image/jpeg;base64,${manipulated.base64}`);
      }
    } catch {
      Alert.alert('Помилка', 'Не вдалося обробити зображення');
    }
  };

  const save = async () => {
    const name = fullName.trim();
    if (!name) {
      Alert.alert('Увага', 'Вкажіть повне ім’я');
      return;
    }
    if (!userId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: name,
        email: email.trim() === '' ? null : email.trim(),
        avatarUrl: avatarUri,
      };
      const res = await api.put(`/users/${userId}`, payload);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
      navigation.goBack();
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Фото профілю</Text>
        <View style={styles.avatarBlock}>
          <Pressable onPress={() => void pickAvatar()} style={styles.avatarTouch}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPh}>
                <Text style={styles.avatarInit}>{initials(fullName || '?')}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <MaterialCommunityIcons name="camera" size={18} color="#fff" />
            </View>
          </Pressable>
          {avatarUri ? (
            <Pressable
              onPress={() =>
                Alert.alert('Прибрати фото?', '', [
                  { text: 'Скасувати', style: 'cancel' },
                  { text: 'Прибрати', style: 'destructive', onPress: () => setAvatarUri(null) },
                ])
              }
            >
              <Text style={styles.clearPhoto}>Прибрати фото</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.section}>Дані</Text>
        <Text style={styles.label}>Повне ім’я</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ім’я та прізвище"
          placeholderTextColor={colors.onSurfaceMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Email (необов’язково)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          placeholderTextColor={colors.onSurfaceMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={() => void save()}
          loading={saving}
          disabled={saving}
          buttonColor={colors.primary}
          labelStyle={styles.saveLabel}
          style={styles.saveBtn}
        >
          Зберегти
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  section: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.onBackground,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  avatarBlock: { alignItems: 'center', marginBottom: spacing.lg },
  avatarTouch: { position: 'relative' },
  avatarImg: { width: 112, height: 112, borderRadius: 56 },
  avatarPh: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInit: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 36,
    color: colors.onBackground,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  clearPhoto: {
    marginTop: spacing.sm,
    color: '#C62828',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.onBackground,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  saveBtn: { marginTop: spacing.lg, borderRadius: radius.md },
  saveLabel: { fontFamily: typography.fontFamily.semiBold, paddingVertical: 4 },
});
