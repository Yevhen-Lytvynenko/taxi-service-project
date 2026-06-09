import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { CheckeredStrip } from '../components/CheckeredStrip';
import { colors, spacing, radius, typography } from '../theme';

interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  rating?: number;
  role: string;
  createdAt: string;
}

interface ProfileScreenProps {
  onLogout: () => void;
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function RatingStars({ value }: { value: number }) {
  const v = Math.min(5, Math.max(0, value));
  const full = Math.round(v);
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < full ? 'star' : 'star-outline'}
          size={20}
          color="#FFB300"
        />
      ))}
    </View>
  );
}

function isUserShape(x: unknown): x is User {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.fullName === 'string' && typeof o.phone === 'string';
}

const LOGOUT_BG = '#D32F2F';

export const ProfileScreen = ({ onLogout }: ProfileScreenProps) => {
  const navigation = useNavigation() as { navigate: (name: string) => void };
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncWarning, setSyncWarning] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadProfile = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent;
      if (!silent) setLoading(true);
      setLoadError(false);
      setSyncWarning(false);
      let hadCache = false;
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (isUserShape(parsed)) {
            setUser(parsed);
            hadCache = true;
          }
        }
      } catch {
        /* ignore */
      }

      try {
        const res = await api.get('/auth/me');
        const u = res.data as User;
        setUser(u);
        setSyncWarning(false);
        await AsyncStorage.setItem('user', JSON.stringify(res.data));
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          setUser(null);
          onLogout();
          return;
        }
        if (hadCache) {
          setSyncWarning(true);
        } else if (!silent) {
          setUser(null);
          setLoadError(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [onLogout]
  );

  useFocusEffect(
    useCallback(() => {
      void loadProfile({ silent: true });
    }, [loadProfile])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    onLogout();
  };

  if (loading && !user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user && loadError) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Не вдалося завантажити профіль. Перевірте мережу, EXPO_PUBLIC_LAN_HOST або EXPO_PUBLIC_API_URL у .env.</Text>
        <Pressable style={styles.retryBtn} onPress={() => void loadProfile()}>
          <Text style={styles.retryBtnText}>Спробувати знову</Text>
        </Pressable>
      </View>
    );
  }

  if (!user) return null;

  const ratingVal = user.rating ?? 5;

  return (
    <View style={[styles.shell, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Strum</Text>
          <Text style={styles.subtitle}>Профіль</Text>
          <CheckeredStrip height={6} />
        </View>

        {syncWarning ? (
          <Text style={styles.syncHint}>
            Не вдалося оновити з сервера — показано дані з кешу. Перевірте мережу або .env (EXPO_PUBLIC_LAN_HOST / EXPO_PUBLIC_API_URL).
          </Text>
        ) : null}

        <View style={styles.heroCard}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.avatarOuter}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials(user.fullName)}</Text>
              </View>
            )}
            <View style={styles.avatarPen}>
              <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.heroName}>{user.fullName}</Text>
          <RatingStars value={ratingVal} />
          <Text style={styles.heroRatingNum}>{ratingVal.toFixed(1)} з 5</Text>
          <Text style={styles.heroPhone}>{user.phone}</Text>
          <Pressable style={styles.editLink} onPress={() => navigation.navigate('EditProfile')}>
            <MaterialCommunityIcons name="account-edit-outline" size={18} color={colors.primary} />
            <Text style={styles.editLinkText}>Редагувати профіль</Text>
          </Pressable>
        </View>

        <View style={styles.menu}>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('SavedPlaces')}>
            <MaterialCommunityIcons name="map-marker-star-outline" size={22} color={colors.primary} />
            <Text style={styles.menuText}>Збережені адреси</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('TripHistory')}>
            <MaterialCommunityIcons name="history" size={22} color={colors.primary} />
            <Text style={styles.menuText}>Історія поїздок</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('ReviewsAboutMe')}>
            <MaterialCommunityIcons name="comment-text-outline" size={22} color={colors.primary} />
            <Text style={styles.menuText}>Відгуки про мене</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('Contacts')}>
            <MaterialCommunityIcons name="account-heart-outline" size={22} color={colors.primary} />
            <Text style={styles.menuText}>Обране та заблоковані водії</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
          <Pressable
            style={[styles.menuRow, styles.menuLogoutRow]}
            onPress={() =>
              Alert.alert('Вихід', 'Ви впевнені, що хочете вийти?', [
                { text: 'Скасувати', style: 'cancel' },
                { text: 'Вийти', style: 'destructive', onPress: handleLogout },
              ])
            }
          >
            <MaterialCommunityIcons name="logout" size={22} color="#fff" />
            <Text style={styles.menuLogoutText}>Вийти з акаунту</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    textAlign: 'center',
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  retryBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
  },
  syncHint: {
    fontSize: 12,
    color: '#b8860b',
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitials: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    color: colors.onBackground,
  },
  avatarPen: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.onBackground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
  },
  heroRatingNum: {
    marginTop: 4,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.medium,
  },
  heroPhone: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  editLinkText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLogoutRow: {
    borderBottomWidth: 0,
    backgroundColor: LOGOUT_BG,
  },
  menuLogoutText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: '#FFFFFF',
  },
  menuText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.onBackground,
  },
});
