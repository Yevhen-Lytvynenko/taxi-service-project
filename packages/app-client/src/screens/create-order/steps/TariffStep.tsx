import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, interaction, radius, spacing, typography } from '../../../theme';
import type { QuoteResponse } from '../types';
import { getTariffVisual } from '../tariffPresentation';

type TariffStepProps = {
  quote: QuoteResponse | null;
  quoteLoading: boolean;
  quoteError: string | null;
  selectedTariff: string | null;
  onSelectTariff: (code: string) => void;
  /** Панель замовлення розгорнута — підказка заповнює вільний простір */
  expanded?: boolean;
};

/** Вертикальний список класів поїздки у стилі UKLON */
export function TariffStep({
  quote,
  quoteLoading,
  quoteError,
  selectedTariff,
  onSelectTariff,
  expanded = false,
}: TariffStepProps) {
  if (quoteLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Будуємо маршрут і ціни…</Text>
      </View>
    );
  }

  if (quoteError) {
    return <Text style={styles.errorText}>{quoteError}</Text>;
  }

  if (!quote?.tariffs?.length) {
    return (
      <View style={[styles.hintWrap, expanded && styles.hintWrapExpanded]}>
        <MaterialCommunityIcons
          name="car-select"
          size={32}
          color={colors.onSurfaceMuted}
          style={expanded ? styles.hintIcon : undefined}
        />
        <Text style={[styles.hintText, expanded && styles.hintTextExpanded]}>
          Вкажіть обидві точки — тут з’являться класи та вартість поїздки.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.sectionTitle}>Оберіть клас поїздки</Text>
      {quote.surgeMultiplier !== 1 ? (
        <Text style={styles.surgeHint}>Коефіцієнт ×{quote.surgeMultiplier}</Text>
      ) : null}
      {quote.tariffs.map((t) => {
        const sel = selectedTariff === t.code;
        const vis = getTariffVisual(t.code);
        const preSurge =
          quote.surgeMultiplier > 1
            ? Math.round((t.totalPrice / quote.surgeMultiplier) * 100) / 100
            : null;
        return (
          <Pressable
            key={t.code}
            onPress={() => onSelectTariff(t.code)}
            style={({ pressed }) => [
              styles.row,
              sel && styles.rowSelected,
              pressed && { opacity: interaction.pressedOpacity },
            ]}
          >
            <View style={styles.iconWrap}>
              {vis.imageUrl ? (
                <Image source={{ uri: vis.imageUrl }} style={styles.img} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons
                  name={vis.icon}
                  size={24}
                  color={sel ? colors.onBackground : colors.onSurfaceMuted}
                />
              )}
            </View>
            <View style={styles.mid}>
              <Text style={[styles.title, sel && styles.titleSelected]} numberOfLines={1}>
                {t.title}
              </Text>
              <Text style={styles.sub} numberOfLines={2}>
                {t.subtitle}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={[styles.price, sel && styles.priceSelected]}>
                {t.totalPrice.toFixed(0)} ₴
              </Text>
              {preSurge != null && preSurge < t.totalPrice - 0.01 ? (
                <Text style={styles.strike}>{preSurge.toFixed(0)} ₴</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.sm,
    gap: 6,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
  },
  surgeHint: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.medium,
    marginTop: -4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    flex: 1,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
  },
  hintWrap: {
    marginTop: spacing.sm,
  },
  hintWrapExpanded: {
    flex: 1,
    minHeight: 120,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hintIcon: {
    opacity: 0.7,
  },
  hintText: {
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
  hintTextExpanded: {
    fontSize: typography.fontSize.md,
    maxWidth: 280,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 54,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  iconWrap: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  img: {
    width: 34,
    height: 28,
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
  },
  titleSelected: {},
  sub: {
    fontSize: typography.fontSize.xs,
    color: colors.onSurfaceMuted,
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 16,
  },
  priceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  price: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.onBackground,
  },
  priceSelected: {},
  strike: {
    fontSize: 11,
    color: colors.onSurfaceMuted,
    textDecorationLine: 'line-through',
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
  },
});
