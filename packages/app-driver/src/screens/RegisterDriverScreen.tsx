import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import api from '../api/axios';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Реєстрація водія</Text>

      <View style={styles.form}>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="ПІБ"
          placeholderTextColor="#888888"
          style={styles.input}
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Телефон"
          placeholderTextColor="#888888"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Номер водійського посвідчення"
          placeholderTextColor="#888888"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          placeholderTextColor="#888888"
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="Підтвердження пароля"
          placeholderTextColor="#888888"
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          labelStyle={{ fontSize: 18, paddingVertical: 5 }}
          style={styles.button}
        >
          СТВОРИТИ АКАУНТ
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          textColor="#ffd451"
          style={styles.linkButton}
        >
          Вже є акаунт? Вхід
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#1a1a1a',
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    padding: 16,
    borderRadius: 2,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    borderRadius: 0,
  },
  linkButton: {
    marginTop: 20,
  },
});
