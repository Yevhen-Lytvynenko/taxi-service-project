import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Alert, Image } from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/Logo.png')} style={styles.logoImage} />
        <Text style={styles.logo}>Strum</Text>
        <Text style={styles.subtitle}>Водій</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Телефон"
          placeholderTextColor="#888888"
          keyboardType="phone-pad"
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

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          labelStyle={{ fontSize: 18, paddingVertical: 5 }}
          style={styles.button}
        >
          УВІЙТИ
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          textColor="#ffd451"
          style={styles.linkButton}
        >
          Немає акаунту? Реєстрація
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
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 80,
    height: 120,
    marginBottom: 8,
  },
  logo: {
    color: '#ffd451',
    fontWeight: 'bold',
    fontSize: 28,
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
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
