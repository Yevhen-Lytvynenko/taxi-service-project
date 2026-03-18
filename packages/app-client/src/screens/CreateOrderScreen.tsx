import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import api from '../api/axios';

interface CreateOrderScreenProps {
  navigation: { navigate: (name: string) => void };
}

export const CreateOrderScreen = ({ navigation }: CreateOrderScreenProps) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Помилка', 'Введіть адреси відправлення та призначення');
      return;
    }
    setLoading(true);
    try {
      await api.post('/orders', {
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
      });
      Alert.alert('Успіх', 'Замовлення створено! Очікуйте водія.', [
        { text: 'OK', onPress: () => navigation.navigate('Profile') },
      ]);
      setPickupAddress('');
      setDropoffAddress('');
    } catch (error: any) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || error.message;
      Alert.alert('Помилка', msg || 'Не вдалося створити замовлення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Strum</Text>
        <Text style={styles.subtitle}>Замовити таксі</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Адреса відправлення"
          placeholderTextColor="#888888"
          style={styles.input}
        />
        <TextInput
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          placeholder="Адреса призначення"
          placeholderTextColor="#888888"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleCreateOrder}
          loading={loading}
          disabled={loading}
          labelStyle={{ fontSize: 18, paddingVertical: 5 }}
          style={styles.button}
        >
          ЗАМОВИТИ
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Profile')}
          textColor="#ffd451"
          style={styles.linkButton}
        >
          Профіль
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
