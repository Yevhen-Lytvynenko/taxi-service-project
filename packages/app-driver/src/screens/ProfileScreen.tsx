import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { CheckeredStrip } from '../components/CheckeredStrip';
import { colors, spacing, radius, typography } from '../theme';

interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  rating?: number;
  role: string;
  createdAt: string;
}

interface ProfileScreenProps {
  navigation?: { navigate: (name: string) => void };
  onLogout: () => void;
}

const InfoRow = ({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string | number;
  last?: boolean;
}) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <MaterialCommunityIcons name={icon} size={20} color={colors.primary} style={styles.infoIcon} />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export const ProfileScreen = ({ navigation, onLogout }: ProfileScreenProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data as User);
      } catch {
        setUser(null);
        onLogout();
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [onLogout]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Strum</Text>
        <Text style={styles.subtitle}>Профіль водія</Text>
        <CheckeredStrip height={6} />
      </View>

      <View style={styles.card}>
        <InfoRow icon="account-outline" label="Повне ім'я" value={user.fullName} />
        <InfoRow icon="phone" label="Телефон" value={user.phone} />
        {user.email && <InfoRow icon="email-outline" label="Email" value={user.email} />}
        <InfoRow icon="star-outline" label="Рейтинг" value={user.rating ?? 5.0} />
        <InfoRow icon="calendar-outline" label="Дата реєстрації" value={formatDate(user.createdAt)} last />
      </View>

      <Button
        mode="outlined"
        onPress={() => {
          Alert.alert(
            'Вихід',
            'Ви впевнені, що хочете вийти?',
            [
              { text: 'Скасувати', style: 'cancel' },
              { text: 'Вийти', onPress: handleLogout, style: 'destructive' },
            ]
          );
        }}
        textColor={colors.primary}
        style={styles.logoutButton}
        labelStyle={styles.logoutLabel}
        icon="logout"
      >
        ВИХІД
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    color: colors.onBackground,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
  },
  logoutButton: {
    borderColor: colors.primary,
    marginTop: 'auto',
    borderRadius: radius.md,
  },
  logoutLabel: {
    fontFamily: typography.fontFamily.semiBold,
  },
});
