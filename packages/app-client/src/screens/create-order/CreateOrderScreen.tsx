import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PaneFocus = 'map' | 'sheet';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import api from '../../api/axios';
import { OSMLeafletMap } from '../../components/OSMLeafletMap';
import { colors, spacing, radius, typography, mapBottomSheet, mapBottomSheetScroll } from '../../theme';
import type { PeerMini, QuoteResponse, SavedPlaceRow } from './types';
import { CLIENT_PREFS } from './types';
import { FlowHeader } from './components/FlowHeader';
import { FlowButton } from './components/FlowButton';
import { AnimatedStepContainer } from './components/AnimatedStepContainer';
import { RouteStep } from './steps/RouteStep';
import type { TripAddressSuggestion } from './steps/RouteStep';
import { TariffStep } from './steps/TariffStep';
import { DeliveryStep, type DeliveryPayerCode } from './steps/DeliveryStep';
import { OptionsStep } from './steps/OptionsStep';

const ODESA_CENTER = { lat: 46.4825, lng: 30.7233 };

/** Тарифи в застосунку: економ, комфорт, доставка (узгоджено з бекендом). */
const QUOTE_TARIFF_CODES = ['ECONOMY', 'STANDARD', 'COMFORT', 'EXPRESS', 'DELIVERY'] as const;

type Point = 'pickup' | 'dropoff';

interface CreateOrderScreenProps {
  navigation: { navigate: (name: string, params?: object) => void };
}

const STEP_TITLES = ['Поїздка', 'Оплата'];

type HistoryOrder = {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  createdAt: string;
  status: string;
};

export function CreateOrderScreen({ navigation }: CreateOrderScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [paneFocus, setPaneFocus] = useState<PaneFocus>('map');

  const setPaneFocusAnimated = useCallback((focus: PaneFocus) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPaneFocus(focus);
  }, []);

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false);
  const [forwardGeoLoading, setForwardGeoLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceRow[]>([]);
  const [favoriteDrivers, setFavoriteDrivers] = useState<PeerMini[]>([]);
  const [preferredDriverUserId, setPreferredDriverUserId] = useState<string | undefined>(undefined);
  const [mapTarget, setMapTarget] = useState<'pickup' | 'dropoff'>('pickup');
  const [tripOrders, setTripOrders] = useState<HistoryOrder[]>([]);
  const [prefModalOpen, setPrefModalOpen] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<string | null>(null);
  const [deliverySenderName, setDeliverySenderName] = useState('');
  const [deliverySenderPhone, setDeliverySenderPhone] = useState('');
  const [deliveryRecipientName, setDeliveryRecipientName] = useState('');
  const [deliveryRecipientPhone, setDeliveryRecipientPhone] = useState('');
  const [deliveryPayer, setDeliveryPayer] = useState<DeliveryPayerCode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [prefToggles, setPrefToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [placesRes, contactsRes, ordersRes] = await Promise.all([
          api.get('/saved-places'),
          api.get('/contacts', { params: { kind: 'FAVORITE' } }),
          api.get('/orders'),
        ]);
        if (cancelled) return;
        setSavedPlaces((placesRes.data as SavedPlaceRow[]) ?? []);
        setTripOrders((ordersRes.data as HistoryOrder[]) ?? []);
        const raw = (contactsRes.data as { peer?: PeerMini }[]) ?? [];
        setFavoriteDrivers(raw.filter((r) => r.peer?.role === 'DRIVER').map((r) => r.peer!));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tripSuggestions = useMemo((): TripAddressSuggestion[] => {
    const seen = new Set<string>();
    const out: TripAddressSuggestion[] = [];
    const list = [...tripOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (const o of list) {
      const pairs: [string, number, number][] = [
        [o.pickupAddress, o.pickupLat, o.pickupLng],
        [o.dropoffAddress, o.dropoffLat, o.dropoffLng],
      ];
      for (const [addr, lat, lng] of pairs) {
        const trimmed = addr.trim();
        const key = trimmed.toLowerCase();
        if (key.length < 4 || seen.has(key)) continue;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        seen.add(key);
        out.push({ id: `${o.id}-${key.slice(0, 20)}`, address: trimmed, lat, lng });
        if (out.length >= 16) return out;
      }
    }
    return out;
  }, [tripOrders]);

  const onApplyRoutePlace = useCallback(
    (lat: number, lng: number, address: string) => {
      if (mapTarget === 'pickup') {
        setPickupAddress(address);
        setPickupCoords({ lat, lng });
      } else {
        setDropoffAddress(address);
        setDropoffCoords({ lat, lng });
      }
      setStepError(null);
    },
    [mapTarget]
  );

  const handleReverseGeocode = useCallback(async (lat: number, lng: number, target: Point) => {
    setReverseGeoLoading(true);
    try {
      const { data } = await api.get(`/geocode/reverse?lat=${lat}&lng=${lng}`);
      const result = data as {
        displayName: string;
        shortLabel?: string;
        lat: number;
        lng: number;
      };
      const label = result.shortLabel?.trim() || result.displayName;
      if (target === 'pickup') {
        setPickupAddress(label);
        setPickupCoords({ lat: result.lat, lng: result.lng });
      } else {
        setDropoffAddress(label);
        setDropoffCoords({ lat: result.lat, lng: result.lng });
      }
    } catch {
      Alert.alert('Помилка', 'Не вдалося визначити адресу для обраної точки');
    } finally {
      setReverseGeoLoading(false);
    }
  }, []);

  const handleMapPress = useCallback(
    (lat: number, lng: number) => {
      setPaneFocusAnimated('map');
      if (currentStep === 0) void handleReverseGeocode(lat, lng, mapTarget);
    },
    [currentStep, mapTarget, handleReverseGeocode, setPaneFocusAnimated]
  );

  useEffect(() => {
    if (currentStep === 1) setPaneFocusAnimated('sheet');
  }, [currentStep, setPaneFocusAnimated]);

  const handleMyLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Доступ заборонено',
          'Надайте дозвіл на геолокацію, щоб використовувати поточне місцезнаходження.'
        );
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

  const loadQuote = useCallback(async () => {
    const hasCoords = !!(pickupCoords && dropoffCoords);
    const pu = pickupAddress.trim();
    const du = dropoffAddress.trim();
    if (!hasCoords && (pu.length < 4 || du.length < 4)) {
      setQuote(null);
      setQuoteError(null);
      setSelectedTariff(null);
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const payload = hasCoords
        ? {
            pickupLat: pickupCoords!.lat,
            pickupLng: pickupCoords!.lng,
            dropoffLat: dropoffCoords!.lat,
            dropoffLng: dropoffCoords!.lng,
          }
        : { pickupAddress: pu, dropoffAddress: du };
      const { data } = await api.post('/orders/quote', {
        ...payload,
        tariffCodes: [...QUOTE_TARIFF_CODES],
      });
      const raw = data as QuoteResponse;
      const q: QuoteResponse = {
        ...raw,
        routePolyline: raw.routePolyline ?? null,
      };
      setQuote(q);
      const codes = (q.tariffs ?? []).map((t) => t.code);
      setSelectedTariff((prev) => (prev != null && codes.includes(prev) ? prev : null));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setQuote(null);
      setSelectedTariff(null);
      setQuoteError(err.response?.data?.error ?? 'Не вдалося розрахувати тарифи');
    } finally {
      setQuoteLoading(false);
    }
  }, [pickupCoords, dropoffCoords, pickupAddress, dropoffAddress]);

  useEffect(() => {
    if (selectedTariff !== 'DELIVERY') {
      setDeliverySenderName('');
      setDeliverySenderPhone('');
      setDeliveryRecipientName('');
      setDeliveryRecipientPhone('');
      setDeliveryPayer(null);
    }
  }, [selectedTariff]);

  useEffect(() => {
    const hasCoords = !!(pickupCoords && dropoffCoords);
    const pu = pickupAddress.trim();
    const du = dropoffAddress.trim();
    if (!hasCoords && (pu.length < 4 || du.length < 4)) {
      setQuote(null);
      setQuoteError(null);
      setSelectedTariff(null);
      return;
    }
    const t = setTimeout(() => {
      void loadQuote();
    }, 450);
    return () => clearTimeout(t);
  }, [
    pickupCoords?.lat,
    pickupCoords?.lng,
    dropoffCoords?.lat,
    dropoffCoords?.lng,
    pickupAddress,
    dropoffAddress,
    loadQuote,
  ]);

  const resolveForwardGeocode = useCallback(
    async (address: string, point: Point): Promise<boolean> => {
      setForwardGeoLoading(true);
      try {
        const geoRes = await api.get('/geocode', { params: { address: address.trim() } });
        const g = geoRes.data as { lat: number; lng: number; displayName: string };
        if (point === 'pickup') {
          setPickupAddress(g.displayName || address.trim());
          setPickupCoords({ lat: g.lat, lng: g.lng });
        } else {
          setDropoffAddress(g.displayName || address.trim());
          setDropoffCoords({ lat: g.lat, lng: g.lng });
        }
        return true;
      } catch {
        return false;
      } finally {
        setForwardGeoLoading(false);
      }
    },
    []
  );

  const handleNextStep = useCallback(async () => {
    setStepError(null);
    if (currentStep !== 0) return;
    const pu = pickupAddress.trim();
    const du = dropoffAddress.trim();
    if (pu.length < 3) {
      setStepError('Введіть адресу відправлення (щонайменше 3 символи)');
      return;
    }
    if (du.length < 3) {
      setStepError('Введіть адресу призначення (щонайменше 3 символи)');
      return;
    }
    if (!pickupCoords) {
      const ok = await resolveForwardGeocode(pu, 'pickup');
      if (!ok) {
        setStepError('Не вдалося знайти «звідки». Уточніть або оберіть на мапі.');
        return;
      }
    }
    if (!dropoffCoords) {
      const ok = await resolveForwardGeocode(du, 'dropoff');
      if (!ok) {
        setStepError('Не вдалося знайти «куди». Уточніть або оберіть на мапі.');
        return;
      }
    }
    if (quoteLoading) {
      setStepError('Зачекайте, будується маршрут…');
      return;
    }
    if (quoteError || !quote?.tariffs?.length) {
      setStepError(quoteError ?? 'Немає тарифів для цього маршруту.');
      return;
    }
    if (!selectedTariff) {
      setStepError('Оберіть клас поїздки зі списку.');
      return;
    }
    if (selectedTariff === 'DELIVERY') {
      if (!deliverySenderName.trim()) {
        setStepError('Вкажіть ім’я відправника.');
        return;
      }
      if (deliverySenderPhone.trim().length < 7) {
        setStepError('Вкажіть телефон відправника.');
        return;
      }
      if (!deliveryRecipientName.trim()) {
        setStepError('Вкажіть ім’я отримувача.');
        return;
      }
      if (deliveryRecipientPhone.trim().length < 7) {
        setStepError('Вкажіть телефон отримувача.');
        return;
      }
      if (!deliveryPayer) {
        setStepError('Оберіть, хто платить за доставку.');
        return;
      }
    }
    setCurrentStep(1);
  }, [
    currentStep,
    pickupAddress,
    dropoffAddress,
    pickupCoords,
    dropoffCoords,
    resolveForwardGeocode,
    quoteLoading,
    quoteError,
    quote,
    selectedTariff,
    deliverySenderName,
    deliverySenderPhone,
    deliveryRecipientName,
    deliveryRecipientPhone,
    deliveryPayer,
  ]);

  const goBackStep = useCallback(() => {
    setStepError(null);
    setCurrentStep((s) => {
      const next = Math.max(0, s - 1);
      if (next === 0) setPaneFocusAnimated('map');
      return next;
    });
  }, [setPaneFocusAnimated]);

  const handleCreateOrder = useCallback(async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      Alert.alert('Помилка', 'Введіть адреси відправлення та призначення');
      return;
    }
    if (!selectedTariff) {
      Alert.alert('Тариф', 'Спочатку оберіть тариф із розрахованих цін');
      return;
    }
    setLoading(true);
    try {
      const prefsList = CLIENT_PREFS.filter((p) => prefToggles[p.id]).map((p) => p.id);
      const body: Record<string, unknown> = {
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        tariffName: selectedTariff,
        paymentMethod,
        ...(prefsList.length ? { clientPreferences: prefsList } : {}),
      };
      if (preferredDriverUserId) body.preferredDriverUserId = preferredDriverUserId;
      if (pickupCoords && dropoffCoords) {
        body.pickupLat = pickupCoords.lat;
        body.pickupLng = pickupCoords.lng;
        body.dropoffLat = dropoffCoords.lat;
        body.dropoffLng = dropoffCoords.lng;
      }
      if (selectedTariff === 'DELIVERY' && deliveryPayer) {
        body.deliverySenderName = deliverySenderName.trim();
        body.deliverySenderPhone = deliverySenderPhone.trim();
        body.deliveryRecipientName = deliveryRecipientName.trim();
        body.deliveryRecipientPhone = deliveryRecipientPhone.trim();
        body.deliveryPayer = deliveryPayer;
      }
      const { data } = await api.post('/orders', body);
      const order = data as { id: string };
      setPickupAddress('');
      setDropoffAddress('');
      setPickupCoords(null);
      setDropoffCoords(null);
      setPreferredDriverUserId(undefined);
      setQuote(null);
      setPrefToggles({});
      setPaymentMethod('CASH');
      setSelectedTariff(null);
      setDeliverySenderName('');
      setDeliverySenderPhone('');
      setDeliveryRecipientName('');
      setDeliveryRecipientPhone('');
      setDeliveryPayer(null);
      setMapTarget('pickup');
      setCurrentStep(0);
      navigation.navigate('OrderTracking', { orderId: order.id });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || 'Не вдалося створити замовлення';
      Alert.alert('Помилка', msg);
    } finally {
      setLoading(false);
    }
  }, [
    pickupAddress,
    dropoffAddress,
    selectedTariff,
    paymentMethod,
    prefToggles,
    preferredDriverUserId,
    pickupCoords,
    dropoffCoords,
    navigation,
    deliveryPayer,
    deliverySenderName,
    deliverySenderPhone,
    deliveryRecipientName,
    deliveryRecipientPhone,
  ]);

  const leafletCenter = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];
    if (pickupCoords) points.push(pickupCoords);
    if (dropoffCoords) points.push(dropoffCoords);
    if (points.length === 0) return ODESA_CENTER;
    if (points.length === 1) return points[0];
    return {
      lat: (points[0].lat + points[1].lat) / 2,
      lng: (points[0].lng + points[1].lng) / 2,
    };
  }, [pickupCoords?.lat, pickupCoords?.lng, dropoffCoords?.lat, dropoffCoords?.lng]);

  const leafletMarkers = useMemo((): {
    lat: number;
    lng: number;
    type: 'pickup' | 'dropoff';
    title: string;
  }[] => {
    const m: { lat: number; lng: number; type: 'pickup' | 'dropoff'; title: string }[] = [];
    if (pickupCoords) m.push({ ...pickupCoords, type: 'pickup', title: 'Відправлення' });
    if (dropoffCoords) m.push({ ...dropoffCoords, type: 'dropoff', title: 'Призначення' });
    return m;
  }, [pickupCoords?.lat, pickupCoords?.lng, dropoffCoords?.lat, dropoffCoords?.lng]);

  const mapPaneFlex = paneFocus === 'map' ? 2 : 1;
  const sheetPaneFlex = paneFocus === 'sheet' ? 2 : 1;
  const tariffsReady = !!(quote?.tariffs?.length);

  const deliveryFilled =
    selectedTariff !== 'DELIVERY' ||
    (deliverySenderName.trim().length > 0 &&
      deliverySenderPhone.trim().length >= 7 &&
      deliveryRecipientName.trim().length > 0 &&
      deliveryRecipientPhone.trim().length >= 7 &&
      deliveryPayer != null);

  const canProceedRoute =
    (pickupCoords != null || pickupAddress.trim().length >= 3) &&
    (dropoffCoords != null || dropoffAddress.trim().length >= 3);

  const canProceedTariff =
    !!selectedTariff && tariffsReady && !quoteLoading && !quoteError && deliveryFilled;

  const canSubmitConfirm =
    !!pickupAddress.trim() &&
    !!dropoffAddress.trim() &&
    !!selectedTariff &&
    tariffsReady &&
    !quoteLoading &&
    !loading;

  const footerDisabledStep0 =
    forwardGeoLoading ||
    !canProceedRoute ||
    quoteLoading ||
    !!quoteError ||
    !tariffsReady ||
    !canProceedTariff;

  const footerDisabled =
    loading || (currentStep === 0 ? footerDisabledStep0 : !canSubmitConfirm);

  const orderSummary = useMemo(() => {
    if (!selectedTariff || !quote) return null;
    const t = quote.tariffs.find((x) => x.code === selectedTariff);
    const payerLabel =
      deliveryPayer === 'SENDER'
        ? 'Відправник'
        : deliveryPayer === 'RECIPIENT'
          ? 'Отримувач'
          : deliveryPayer === 'CLIENT'
            ? 'Замовник у застосунку'
            : '—';
    const deliveryLines =
      selectedTariff === 'DELIVERY' && deliveryPayer
        ? [
            `Відправник: ${deliverySenderName.trim()} · ${deliverySenderPhone.trim()}`,
            `Отримувач: ${deliveryRecipientName.trim()} · ${deliveryRecipientPhone.trim()}`,
            `Оплачує: ${payerLabel}`,
          ]
        : undefined;
    return {
      pickup: pickupAddress.trim() || '—',
      dropoff: dropoffAddress.trim() || '—',
      tariffTitle: t?.title ?? selectedTariff,
      price: t ? `${t.totalPrice.toFixed(0)} ₴` : '—',
      routeMeta: `~${quote.plannedRouteDistanceKm.toFixed(1)} км · ~${Math.round(quote.plannedRouteDurationMin)} хв`,
      deliveryLines,
    };
  }, [
    selectedTariff,
    quote,
    pickupAddress,
    dropoffAddress,
    deliveryPayer,
    deliverySenderName,
    deliverySenderPhone,
    deliveryRecipientName,
    deliveryRecipientPhone,
  ]);

  const footerLabel = currentStep === 1 ? 'Замовити' : 'Далі';
  const footerLoading = currentStep === 1 ? loading : forwardGeoLoading;

  const onFooterPress = () => {
    if (currentStep === 1) void handleCreateOrder();
    else void handleNextStep();
  };

  const sheetExpanded = paneFocus === 'sheet';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.mapPane, { flex: mapPaneFlex }]}>
        <OSMLeafletMap
          center={leafletCenter}
          zoom={13}
          markers={leafletMarkers}
          routePolyline={quote?.routePolyline ?? null}
          onMapPress={handleMapPress}
          style={styles.mapFill}
        />
        {reverseGeoLoading && (
          <View style={styles.mapOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.mapOverlayText}>Адреса…</Text>
          </View>
        )}
        {sheetExpanded && currentStep === 0 ? (
          <Pressable
            style={styles.mapExpandChip}
            onPress={() => setPaneFocusAnimated('map')}
            accessibilityLabel="Розгорнути карту"
          >
            <MaterialCommunityIcons name="map" size={18} color={colors.onBackground} />
            <Text style={styles.mapExpandChipText}>Карта</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.sheetKeyboard, { flex: sheetPaneFlex }]}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderWrap}>
            <FlowHeader
              title={STEP_TITLES[currentStep] ?? ''}
              stepIndex={currentStep}
              showBack={currentStep > 0}
              onBack={goBackStep}
              dense
            />
          </View>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={[
              styles.sheetContent,
              sheetExpanded && styles.sheetContentExpanded,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={!sheetExpanded}
            onTouchStart={() => setPaneFocusAnimated('sheet')}
            onScrollBeginDrag={() => setPaneFocusAnimated('sheet')}
          >
            <AnimatedStepContainer
              stepIndex={currentStep}
              style={sheetExpanded ? styles.stepExpanded : undefined}
            >
              {currentStep === 0 ? (
                <>
                  <RouteStep
                    pickupAddress={pickupAddress}
                    dropoffAddress={dropoffAddress}
                    onPickupChange={(t) => {
                      setPickupAddress(t);
                      setStepError(null);
                      if (!t.trim()) setPickupCoords(null);
                    }}
                    onDropoffChange={(t) => {
                      setDropoffAddress(t);
                      setStepError(null);
                      if (!t.trim()) setDropoffCoords(null);
                    }}
                    mapTarget={mapTarget}
                    onMapTargetChange={setMapTarget}
                    onPreferMapPane={() => setPaneFocusAnimated('map')}
                    onPreferSheetPane={() => setPaneFocusAnimated('sheet')}
                    savedPlaces={savedPlaces}
                    tripSuggestions={tripSuggestions}
                    onApplyPlace={onApplyRoutePlace}
                    onMyLocation={() => {
                      setMapTarget('pickup');
                      setPaneFocusAnimated('map');
                      void handleMyLocation();
                    }}
                    locationLoading={locationLoading}
                  />
                  <TariffStep
                    quote={quote}
                    quoteLoading={quoteLoading}
                    quoteError={quoteError}
                    selectedTariff={selectedTariff}
                    expanded={sheetExpanded}
                    onSelectTariff={(code) => {
                      setPaneFocusAnimated('sheet');
                      setSelectedTariff(code);
                    }}
                  />
                  {selectedTariff === 'DELIVERY' ? (
                    <DeliveryStep
                      senderName={deliverySenderName}
                      senderPhone={deliverySenderPhone}
                      recipientName={deliveryRecipientName}
                      recipientPhone={deliveryRecipientPhone}
                      payer={deliveryPayer}
                      onSenderName={setDeliverySenderName}
                      onSenderPhone={setDeliverySenderPhone}
                      onRecipientName={setDeliveryRecipientName}
                      onRecipientPhone={setDeliveryRecipientPhone}
                      onPayer={setDeliveryPayer}
                    />
                  ) : null}
                </>
              ) : null}
              {currentStep === 1 ? (
                <OptionsStep
                  summary={orderSummary}
                  paymentMethod={paymentMethod}
                  onPaymentMethod={setPaymentMethod}
                  prefToggles={prefToggles}
                  onTogglePref={(id) =>
                    setPrefToggles((prev) => ({ ...prev, [id]: !prev[id] }))
                  }
                  favoriteDrivers={favoriteDrivers}
                  preferredDriverUserId={preferredDriverUserId}
                  onOpenDriverModal={() => setPrefModalOpen(true)}
                />
              ) : null}
            </AnimatedStepContainer>
            {stepError && !sheetExpanded ? <Text style={styles.stepError}>{stepError}</Text> : null}
            {sheetExpanded ? <View style={styles.sheetFlexFiller} /> : null}
          </ScrollView>
          <View style={[styles.sheetFooter, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            {stepError ? <Text style={styles.stepErrorFooter}>{stepError}</Text> : null}
            <FlowButton
              label={footerLabel}
              onPress={onFooterPress}
              disabled={footerDisabled}
              loading={footerLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={prefModalOpen} transparent animationType="fade">
        <Pressable style={styles.prefModalBackdrop} onPress={() => setPrefModalOpen(false)}>
          <Pressable style={styles.prefSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.prefSheetTitle}>Пріоритетний водій</Text>
            <Pressable
              style={({ pressed }) => [styles.prefOption, pressed && { opacity: 0.75 }]}
              onPress={() => {
                setPreferredDriverUserId(undefined);
                setPrefModalOpen(false);
              }}
            >
              <Text style={styles.prefOptionText}>Без пріоритету</Text>
            </Pressable>
            {favoriteDrivers.map((d) => (
              <Pressable
                key={d.id}
                style={({ pressed }) => [styles.prefOption, pressed && { opacity: 0.75 }]}
                onPress={() => {
                  setPreferredDriverUserId(d.id);
                  setPrefModalOpen(false);
                }}
              >
                <Text style={styles.prefOptionText}>{d.fullName}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  mapPane: {
    width: '100%',
    overflow: 'hidden',
    minHeight: 120,
    backgroundColor: '#e8e8ed',
  },
  mapFill: {
    flex: 1,
    width: '100%',
  },
  mapExpandChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  mapExpandChipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.onBackground,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  sheetKeyboard: {
    minHeight: 140,
  },
  bottomSheet: {
    flex: 1,
    ...mapBottomSheet,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeaderWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sheetScroll: {
    ...mapBottomSheetScroll,
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  sheetContentExpanded: {
    flexGrow: 1,
  },
  stepExpanded: {
    flex: 1,
  },
  sheetFlexFiller: {
    flexGrow: 1,
    minHeight: spacing.md,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  stepError: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
  },
  stepErrorFooter: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  prefModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  prefSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
  prefSheetTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  prefOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prefOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.onBackground,
  },
});
