import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

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
        <ActivityIndicator size="large" color="#ffd451" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Повне ім'я</Text>
        <Text style={styles.value}>{user.fullName}</Text>

        <Text style={styles.label}>Телефон</Text>
        <Text style={styles.value}>{user.phone}</Text>

        {user.email && (
          <>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </>
        )}

        <Text style={styles.label}>Рейтинг</Text>
        <Text style={styles.value}>{user.rating ?? 5.0}</Text>

        <Text style={styles.label}>Дата реєстрації</Text>
        <Text style={styles.value}>{formatDate(user.createdAt)}</Text>
      </View>

      <Button
        mode="contained"
        onPress={() => navigation?.navigate('OrdersQueue')}
        style={styles.ordersButton}
      >
        Черга замовлень
      </Button>

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
        textColor="#ffd451"
        style={styles.logoutButton}
      >
        ВИХІД
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
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
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 2,
    marginBottom: 30,
  },
  ordersButton: {
    marginBottom: 16,
  },
  label: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 16,
  },
  value: {
    color: '#1a1a1a',
    fontSize: 16,
  },
  logoutButton: {
    borderColor: '#ffd451',
    marginTop: 'auto',
  },
});
