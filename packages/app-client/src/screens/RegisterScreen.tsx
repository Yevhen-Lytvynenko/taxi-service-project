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

interface RegisterScreenProps {
  navigation: { navigate: (name: string) => void };
}

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phone || !password) {
      return Alert.alert('Помилка', 'Заповніть всі поля');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName,
        phone,
        password,
      });
      Alert.alert('Успіх', 'Акаунт створено! Тепер увійдіть.');
      navigation.navigate('Login');
    } catch {
      Alert.alert(
        'Помилка',
        'Не вдалося зареєструватися. Можливо такий номер вже є.'
      );
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
          <Text style={styles.title}>Реєстрація</Text>
          <CheckeredStrip height={6} />
        </View>

        <View style={styles.form}>
          <InputWithIcon
            icon="account-outline"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Повне ім'я"
          />
          <InputWithIcon
            icon="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Телефон"
            keyboardType="phone-pad"
          />
          <InputWithIcon
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Пароль"
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.onBackground,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
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
