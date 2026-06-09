import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { interaction, colors, radius, spacing, typography } from '../../../theme';
import { CLIENT_PREFS } from '../types';
import type { PeerMini } from '../types';

export type OrderSummaryBlock = {
  pickup: string;
  dropoff: string;
  tariffTitle: string;
  price: string;
  routeMeta: string;
  /** Рядки для тарифу доставки */
  deliveryLines?: string[];
};

type OptionsStepProps = {
  summary: OrderSummaryBlock | null;
  paymentMethod: 'CASH' | 'CARD';
  onPaymentMethod: (m: 'CASH' | 'CARD') => void;
  prefToggles: Record<string, boolean>;
  onTogglePref: (id: string) => void;
  favoriteDrivers: PeerMini[];
  preferredDriverUserId: string | undefined;
  onOpenDriverModal: () => void;
};

/** Оплата та опції у стилі UKLON: сірі ряди, іконки, стрілка */
export function OptionsStep({
  summary,
  paymentMethod,
  onPaymentMethod,
  prefToggles,
  onTogglePref,
  favoriteDrivers,
  preferredDriverUserId,
  onOpenDriverModal,
}: OptionsStepProps) {
  return (
    <View style={styles.root}>
      {summary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.sumLine} numberOfLines={2}>
            <Text style={styles.sumMuted}>Звідки · </Text>
            {summary.pickup}
          </Text>
          <Text style={[styles.sumLine, styles.sumPad]} numberOfLines={2}>
            <Text style={styles.sumMuted}>Куди · </Text>
            {summary.dropoff}
          </Text>
          <Text style={styles.sumDivider} />
          {summary.deliveryLines?.length ? (
            <>
              {summary.deliveryLines.map((line, i) => (
                <Text key={`dl-${i}`} style={styles.sumDeliveryLine} numberOfLines={3}>
                  {line}
                </Text>
              ))}
              <View style={styles.sumDivider} />
            </>
          ) : null}
          <View style={styles.sumRow}>
            <Text style={styles.sumTariff}>{summary.tariffTitle}</Text>
            <Text style={styles.sumPrice}>{summary.price}</Text>
          </View>
          <Text style={styles.sumMeta}>{summary.routeMeta}</Text>
        </View>
      ) : null}

      <Text style={styles.blockTitle}>Оплата</Text>
      <Pressable
        onPress={() => onPaymentMethod('CASH')}
        style={({ pressed }) => [
          styles.payRow,
          paymentMethod === 'CASH' && styles.payRowOn,
          pressed && { opacity: interaction.pressedOpacity },
        ]}
      >
        <MaterialCommunityIcons name="cash" size={22} color="#34C759" />
        <Text style={styles.payLabel}>Готівка</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
      </Pressable>
      <Pressable
        onPress={() => onPaymentMethod('CARD')}
        style={({ pressed }) => [
          styles.payRow,
          paymentMethod === 'CARD' && styles.payRowOn,
          pressed && { opacity: interaction.pressedOpacity },
        ]}
      >
        <MaterialCommunityIcons name="credit-card-outline" size={20} color={colors.onBackground} />
        <Text style={styles.payLabel}>Карта / Google Pay</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
      </Pressable>

      <Text style={[styles.blockTitle, styles.blockTitlePad]}>Додаткові послуги</Text>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.prefScroll}>
        <View style={styles.prefChipsWrap}>
          {CLIENT_PREFS.map((p) => {
            const on = !!prefToggles[p.id];
            return (
              <Pressable
                key={p.id}
                onPress={() => onTogglePref(p.id)}
                style={({ pressed }) => [
                  styles.prefChip,
                  on && styles.prefChipOn,
                  pressed && { transform: [{ scale: interaction.chipPressedScale }] },
                ]}
              >
                <Text style={[styles.prefChipText, on && styles.prefChipTextOn]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {favoriteDrivers.length > 0 ? (
        <Pressable
          onPress={onOpenDriverModal}
          style={({ pressed }) => [styles.prefRow, pressed && { opacity: interaction.pressedOpacity }]}
        >
          <Text style={styles.prefRowLabel}>Пріоритетний водій</Text>
          <View style={styles.prefRowRight}>
            <Text style={styles.prefRowValue} numberOfLines={1}>
              {preferredDriverUserId
                ? favoriteDrivers.find((d) => d.id === preferredDriverUserId)?.fullName ?? '—'
                : 'Ні'}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
  summaryCard: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sumLine: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.onBackground,
    lineHeight: 18,
  },
  sumPad: {
    marginTop: 4,
  },
  sumMuted: {
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  sumDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sumTariff: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
    flex: 1,
    marginRight: spacing.md,
  },
  sumPrice: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.onBackground,
  },
  sumMeta: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  sumDeliveryLine: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.onBackground,
    marginBottom: 4,
    lineHeight: 18,
  },
  blockTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
    marginBottom: 6,
  },
  blockTitlePad: {
    marginTop: spacing.sm,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  payRowOn: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  payLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.onBackground,
  },
  prefScroll: {
    maxHeight: 120,
    backgroundColor: 'transparent',
  },
  prefChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prefChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  prefChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.onSurfaceMuted,
  },
  prefChipTextOn: {
    color: colors.onBackground,
    fontFamily: typography.fontFamily.semiBold,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  prefRowLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  prefRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: spacing.md,
  },
  prefRowValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.onBackground,
    textAlign: 'right',
    maxWidth: '70%',
  },
});
