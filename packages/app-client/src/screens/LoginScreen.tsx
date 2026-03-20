import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { CheckeredStrip } from '../components/CheckeredStrip';
import { colors, spacing, radius, typography } from '../theme';

interface LoginScreenProps {
  navigation: { navigate: (name: string) => void };
  onLoginSuccess: () => void;
}

export const LoginScreen = ({ navigation, onLoginSuccess }: LoginScreenProps) => {
  const [phone, setPhone] = useState('+380');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('Помилка', 'Заповніть всі поля');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone, password });
      const data = res.data as { token: string; user: object };
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess();
    } catch {
      Alert.alert('Помилка', 'Невірний телефон або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.header}>
        <Image source={require('../../assets/Logo.png')} style={styles.logoImage} />
        <Text style={styles.logo}>Strum</Text>
        <Text style={styles.subtitle}>Клієнт</Text>
        <CheckeredStrip height={6} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="phone" size={22} color={colors.onSurfaceMuted} style={styles.inputIcon} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Телефон"
            placeholderTextColor={colors.onSurfaceMuted}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="lock-outline" size={22} color={colors.onSurfaceMuted} style={styles.inputIcon} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Пароль"
            placeholderTextColor={colors.onSurfaceMuted}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          labelStyle={styles.buttonLabel}
          style={styles.button}
        >
          УВІЙТИ
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
          <Text style={styles.linkText}>Немає акаунту? </Text>
          <Text style={styles.linkAccent}>Реєстрація</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logoImage: {
    width: 64,
    height: 96,
    marginBottom: spacing.sm,
    resizeMode: 'contain',
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
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.onBackground,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
  },
  buttonLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    paddingVertical: 6,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
  },
  linkAccent: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
  },
});
