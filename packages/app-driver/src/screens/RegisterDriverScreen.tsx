import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axios';
import { CheckeredStrip } from '../components/CheckeredStrip';
import { colors, spacing, radius, typography } from '../theme';

interface RegisterDriverScreenProps {
  navigation: { navigate: (name: string) => void };
}

export const RegisterDriverScreen = ({ navigation }: RegisterDriverScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phone || !licenseNumber || !password || !passwordConfirm) {
      return Alert.alert('Помилка', 'Заповніть всі поля');
    }
    if (password !== passwordConfirm) {
      return Alert.alert('Помилка', 'Паролі не співпадають');
    }
    setLoading(true);
    try {
      await api.post('/auth/register/driver', {
        fullName,
        phone,
        licenseNumber,
        password,
      });
      Alert.alert('Успіх', 'Акаунт створено! Тепер увійдіть.');
      navigation.navigate('Login');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Не вдалося зареєструватися. Можливо такий номер вже є.';
      Alert.alert('Помилка', message);
    } finally {
      setLoading(false);
    }
  };

  const InputWithIcon = ({
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
  }: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'phone-pad' | 'default';
  }) => (
    <View style={styles.inputWrapper}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.onSurfaceMuted} style={styles.inputIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Реєстрація водія</Text>
          <CheckeredStrip height={6} />
        </View>

        <View style={styles.form}>
          <InputWithIcon icon="account-outline" value={fullName} onChangeText={setFullName} placeholder="ПІБ" />
          <InputWithIcon
            icon="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Телефон"
            keyboardType="phone-pad"
          />
          <InputWithIcon
            icon="card-account-details-outline"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="Номер водійського посвідчення"
          />
          <InputWithIcon
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Пароль"
            secureTextEntry
          />
          <InputWithIcon
            icon="lock-check-outline"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            placeholder="Підтвердження пароля"
            secureTextEntry
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            labelStyle={styles.buttonLabel}
            style={styles.button}
          >
            СТВОРИТИ АКАУНТ
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
            <Text style={styles.linkText}>Вже є акаунт? </Text>
            <Text style={styles.linkAccent}>Вхід</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl * 2 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  title: {
    color: colors.onBackground,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.md,
  },
  form: { width: '100%' },
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
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.onBackground,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
  },
  button: { marginTop: spacing.sm, borderRadius: radius.md },
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
