import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, interaction, radius, spacing, typography } from '../../../theme';
import type { SavedPlaceRow } from '../types';
import { shortOrderAddress } from '../../../utils/shortOrderAddress';

export type RouteMapTarget = 'pickup' | 'dropoff';

export type TripAddressSuggestion = {
  id: string;
  address: string;
  lat: number;
  lng: number;
};

type QuickPick = {
  key: string;
  label: string;
  lat: number;
  lng: number;
  address: string;
};

type RouteStepProps = {
  pickupAddress: string;
  dropoffAddress: string;
  onPickupChange: (t: string) => void;
  onDropoffChange: (t: string) => void;
  mapTarget: RouteMapTarget;
  onMapTargetChange: (t: RouteMapTarget) => void;
  /** Розгорнути мапу (2/3 екрана) */
  onPreferMapPane?: () => void;
  /** Розгорнути панель замовлення (2/3 екрана) */
  onPreferSheetPane?: () => void;
  savedPlaces: SavedPlaceRow[];
  tripSuggestions: TripAddressSuggestion[];
  onApplyPlace: (lat: number, lng: number, address: string) => void;
  onMyLocation: () => void;
  locationLoading: boolean;
};

export function RouteStep({
  pickupAddress,
  dropoffAddress,
  onPickupChange,
  onDropoffChange,
  mapTarget,
  onMapTargetChange,
  onPreferMapPane,
  onPreferSheetPane,
  savedPlaces,
  tripSuggestions,
  onApplyPlace,
  onMyLocation,
  locationLoading,
}: RouteStepProps) {
  const quickPicks = useMemo((): QuickPick[] => {
    const seen = new Set<string>();
    const out: QuickPick[] = [];
    const push = (key: string, label: string, lat: number, lng: number, address: string) => {
      const k = address.trim().toLowerCase();
      if (k.length < 3 || seen.has(k)) return;
      seen.add(k);
      out.push({ key, label, lat, lng, address: address.trim() });
    };
    for (const sp of savedPlaces) {
      push(`s-${sp.id}`, sp.label, sp.lat, sp.lng, sp.address);
      if (out.length >= 10) return out;
    }
    for (const s of tripSuggestions) {
      push(s.id, shortOrderAddress(s.address), s.lat, s.lng, s.address);
      if (out.length >= 10) return out;
    }
    return out;
  }, [savedPlaces, tripSuggestions]);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => {
          onMapTargetChange('pickup');
          onPreferMapPane?.();
        }}
        style={({ pressed }) => [
          styles.ukField,
          mapTarget === 'pickup' && styles.ukFieldActive,
          pressed && { opacity: interaction.pressedOpacity },
        ]}
      >
        <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.onBackground} />
        <View style={styles.ukFieldBody}>
          <Text style={styles.ukLabel}>Звідки</Text>
          <TextInput
            placeholder="Торкніться мапи або введіть адресу"
            placeholderTextColor={colors.onSurfaceMuted}
            value={pickupAddress}
            onChangeText={onPickupChange}
            onFocus={() => {
              onMapTargetChange('pickup');
              onPreferSheetPane?.();
            }}
            style={styles.ukInput}
            autoCorrect={false}
          />
        </View>
        <Pressable
          onPress={onMyLocation}
          disabled={locationLoading}
          hitSlop={8}
          style={({ pressed }) => [
            styles.gpsBtn,
            pressed && !locationLoading && { opacity: interaction.pressedOpacity },
          ]}
          accessibilityLabel="Моя геолокація"
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.primary} />
          )}
        </Pressable>
      </Pressable>

      <Pressable
        onPress={() => {
          onMapTargetChange('dropoff');
          onPreferMapPane?.();
        }}
        style={({ pressed }) => [
          styles.ukField,
          mapTarget === 'dropoff' && styles.ukFieldActive,
          pressed && { opacity: interaction.pressedOpacity },
        ]}
      >
        <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.onBackground} />
        <View style={styles.ukFieldBody}>
          <Text style={styles.ukLabel}>Куди їдемо?</Text>
          <TextInput
            placeholder="Куди їдемо?"
            placeholderTextColor={colors.onSurfaceMuted}
            value={dropoffAddress}
            onChangeText={onDropoffChange}
            onFocus={() => {
              onMapTargetChange('dropoff');
              onPreferSheetPane?.();
            }}
            style={styles.ukInput}
            autoCorrect={false}
          />
        </View>
        <View style={styles.gpsSpacer} />
      </Pressable>

      {quickPicks.length > 0 ? (
        <View style={styles.quickWrap}>
          <Text style={styles.quickHint} numberOfLines={1}>
            Нещодавні та збережені
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickScroll}
            contentContainerStyle={styles.quickRow}
          >
            {quickPicks.map((q) => (
              <Pressable
                key={q.key}
                onPress={() => {
                  onPreferSheetPane?.();
                  onApplyPlace(q.lat, q.lng, q.address);
                }}
                style={({ pressed }) => [styles.quickChip, pressed && { opacity: interaction.pressedOpacity }]}
              >
                <MaterialCommunityIcons name="history" size={14} color={colors.onSurfaceMuted} />
                <Text style={styles.quickChipText} numberOfLines={1}>
                  {q.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  ukField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ukFieldActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  ukFieldBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 6,
  },
  ukLabel: {
    fontSize: 10,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 2,
  },
  ukInput: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.onBackground,
    padding: 0,
    margin: 0,
  },
  gpsBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsSpacer: {
    width: 36,
  },
  quickWrap: {
    marginTop: 2,
  },
  quickHint: {
    fontSize: 10,
    color: colors.onSurfaceMuted,
    marginBottom: 4,
    fontFamily: typography.fontFamily.regular,
  },
  quickScroll: {
    maxHeight: 36,
    backgroundColor: 'transparent',
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 168,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickChipText: {
    flexShrink: 1,
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.onBackground,
  },
});
