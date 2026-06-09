import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { CLIENT_PREFS } from '../types';
import type { QuoteResponse } from '../types';

type ConfirmStepProps = {
  pickupAddress: string;
  dropoffAddress: string;
  selectedTariff: string | null;
  quote: QuoteResponse | null;
  paymentMethod: 'CASH' | 'CARD';
  prefToggles: Record<string, boolean>;
  preferredDriverName: string | null;
};

export function ConfirmStep({
  pickupAddress,
  dropoffAddress,
  selectedTariff,
  quote,
  paymentMethod,
  prefToggles,
  preferredDriverName,
}: ConfirmStepProps) {
  const tariffTitle =
    quote?.tariffs?.find((t) => t.code === selectedTariff)?.title ?? selectedTariff ?? '—';
  const price =
    quote?.tariffs?.find((t) => t.code === selectedTariff)?.totalPrice != null
      ? `${quote!.tariffs.find((t) => t.code === selectedTariff)!.totalPrice.toFixed(0)} ₴`
      : '—';

  const prefsLabels = CLIENT_PREFS.filter((p) => prefToggles[p.id]).map((p) => p.label);

  return (
    <View style={styles.root}>
      <View style={styles.line}>
        <Text style={styles.lbl}>Звідки</Text>
        <Text style={styles.val}>{pickupAddress || '—'}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.line}>
        <Text style={styles.lbl}>Куди</Text>
        <Text style={styles.val}>{dropoffAddress || '—'}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row2}>
        <Text style={styles.inline}>
          <Text style={styles.lbl}>Тариф · </Text>
          <Text style={styles.valSm}>{tariffTitle}</Text>
        </Text>
        <Text style={styles.price}>{price}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.inline}>
        <Text style={styles.lbl}>Оплата · </Text>
        <Text style={styles.valSm}>
          {paymentMethod === 'CASH' ? 'готівка' : 'карта / Google Pay'}
        </Text>
      </Text>
      {preferredDriverName ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.inline}>
            <Text style={styles.lbl}>Водій · </Text>
            <Text style={styles.valSm}>{preferredDriverName}</Text>
          </Text>
        </>
      ) : null}
      {prefsLabels.length > 0 ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.lbl}>Побажання</Text>
          <Text style={styles.valCompact}>{prefsLabels.join(' · ')}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: spacing.xs,
  },
  line: {
    paddingVertical: 6,
  },
  lbl: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 2,
  },
  val: {
    fontSize: typography.fontSize.sm,
    color: colors.onBackground,
    fontFamily: typography.fontFamily.semiBold,
    lineHeight: 18,
  },
  valSm: {
    fontSize: typography.fontSize.sm,
    color: colors.onBackground,
    fontFamily: typography.fontFamily.medium,
  },
  valCompact: {
    fontSize: typography.fontSize.xs,
    color: colors.onBackground,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 8,
    gap: spacing.md,
  },
  inline: {
    flex: 1,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.onBackground,
  },
});
