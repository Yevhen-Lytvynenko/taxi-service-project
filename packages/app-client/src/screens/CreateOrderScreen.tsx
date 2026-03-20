import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import * as Location from 'expo-location';
import api from '../api/axios';
import { OSMLeafletMap } from '../components/OSMLeafletMap';

const ODESA_CENTER = { lat: 46.4825, lng: 30.7233 };

interface CreateOrderScreenProps {
  navigation: { navigate: (name: string) => void };
}

type SelectingPoint = 'pickup' | 'dropoff';

export const CreateOrderScreen = ({ navigation }: CreateOrderScreenProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectingPoint, setSelectingPoint] = useState<SelectingPoint>('pickup');
  const [loading, setLoading] = useState(false);
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number, point?: SelectingPoint) => {
      const target = point ?? selectingPoint;
      setReverseGeoLoading(true);
      try {
        const { data } = await api.get(`/geocode/reverse?lat=${lat}&lng=${lng}`);
        const result = data as { displayName: string; lat: number; lng: number };
        if (target === 'pickup') {
          setPickupAddress(result.displayName);
          setPickupCoords({ lat: result.lat, lng: result.lng });
        } else {
          setDropoffAddress(result.displayName);
          setDropoffCoords({ lat: result.lat, lng: result.lng });
        }
      } catch {
        Alert.alert('Помилка', 'Не вдалося визначити адресу для обраної точки');
      } finally {
        setReverseGeoLoading(false);
      }
    },
    [selectingPoint]
  );

  const handleMapPress = useCallback(
    (lat: number, lng: number) => {
      handleReverseGeocode(lat, lng);
    },
    [handleReverseGeocode]
  );

  const handleMyLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Доступ заборонено',
          'Надайте дозвіл на геолокацію, щоб використовувати поточне місцезнаходження.'
        );
        setLocationLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      await handleReverseGeocode(latitude, longitude, 'pickup');
    } catch {
      Alert.alert('Помилка', 'Не вдалося отримати поточне місцезнаходження.');
    } finally {
      setLocationLoading(false);
    }
  }, [handleReverseGeocode]);

  const handleCreateOrder = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Помилка', 'Введіть адреси відправлення та призначення');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
      });
      const order = data as { id: string };
      setPickupAddress('');
      setDropoffAddress('');
      setPickupCoords(null);
      setDropoffCoords(null);
      navigation.navigate('OrderTracking', { orderId: order.id });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || 'Не вдалося створити замовлення';
      Alert.alert('Помилка', msg);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = () => {
    const points: { lat: number; lng: number }[] = [];
    if (pickupCoords) points.push(pickupCoords);
    if (dropoffCoords) points.push(dropoffCoords);
    if (points.length === 0) return ODESA_CENTER;
    if (points.length === 1) return points[0];
    return {
      lat: (points[0].lat + points[1].lat) / 2,
      lng: (points[0].lng + points[1].lng) / 2,
    };
  };

  const mapMarkers = (): { lat: number; lng: number; type: 'pickup' | 'dropoff'; title: string }[] => {
    const m: { lat: number; lng: number; type: 'pickup' | 'dropoff'; title: string }[] = [];
    if (pickupCoords) m.push({ ...pickupCoords, type: 'pickup', title: 'Відправлення' });
    if (dropoffCoords) m.push({ ...dropoffCoords, type: 'dropoff', title: 'Призначення' });
    return m;
  };

  const sheetHeight = Math.min(height * 0.5, 380);

  return (
    <View style={styles.container}>
      <View style={[styles.mapFullScreen, { paddingTop: insets.top }]}>
        <OSMLeafletMap
          center={mapCenter()}
          zoom={13}
          markers={mapMarkers()}
          onMapPress={handleMapPress}
          style={styles.map}
        />
        {reverseGeoLoading && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color="#ffd451" />
            <Text style={styles.mapOverlayText}>Визначення адреси...</Text>
          </View>
        )}
        <View style={[styles.logoOverlay, { top: insets.top + 12 }]}>
          <Text style={styles.logo}>Strum</Text>
        </View>
      </View>

      <View style={[styles.bottomSheet, { height: sheetHeight, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sheetTitle}>Замовити таксі</Text>

          <View style={styles.inputRow}>
            <TextInput
              value={pickupAddress}
              onChangeText={(t) => {
                setPickupAddress(t);
                if (!t.trim()) setPickupCoords(null);
              }}
              placeholder="Адреса відправлення"
              placeholderTextColor="#888888"
              style={[styles.input, styles.inputFlex]}
            />
            <Button
              mode="outlined"
              onPress={handleMyLocation}
              loading={locationLoading}
              disabled={locationLoading}
              style={styles.myLocationBtn}
              labelStyle={styles.myLocationLabel}
            >
              Моє місце
            </Button>
          </View>

          <TextInput
            value={dropoffAddress}
            onChangeText={(t) => {
              setDropoffAddress(t);
              if (!t.trim()) setDropoffCoords(null);
            }}
            placeholder="Адреса призначення"
            placeholderTextColor="#888888"
            style={styles.input}
          />

          <View style={styles.mapSelector}>
            <Text style={styles.mapSelectorLabel}>Обрати на карті:</Text>
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentBtn, selectingPoint === 'pickup' && styles.segmentBtnActive]}
                onPress={() => setSelectingPoint('pickup')}
              >
                <Text style={[styles.segmentText, selectingPoint === 'pickup' && styles.segmentTextActive]}>
                  Відправлення
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, selectingPoint === 'dropoff' && styles.segmentBtnActive]}
                onPress={() => setSelectingPoint('dropoff')}
              >
                <Text style={[styles.segmentText, selectingPoint === 'dropoff' && styles.segmentTextActive]}>
                  Призначення
                </Text>
              </Pressable>
            </View>
          </View>

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
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapFullScreen: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  logoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    color: '#ffd451',
    fontWeight: 'bold',
    fontSize: 24,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  myLocationBtn: {
    flexShrink: 0,
    borderColor: '#ffd451',
  },
  myLocationLabel: {
    fontSize: 12,
  },
  mapSelector: {
    marginBottom: 12,
  },
  mapSelectorLabel: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  segmentBtnActive: {
    backgroundColor: '#ffd451',
  },
  segmentText: {
    color: '#666666',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
});
