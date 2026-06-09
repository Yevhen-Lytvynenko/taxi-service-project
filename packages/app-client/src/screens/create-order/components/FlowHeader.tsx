import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../../theme';
import { CREATE_ORDER_STEPS } from '../types';

type FlowHeaderProps = {
  title: string;
  stepIndex: number;
  onBack: () => void;
  showBack: boolean;
  /** Компактний хедер (крок маршруту), щоб усе вміщувалось без прокрутки */
  dense?: boolean;
};

export function FlowHeader({ title, stepIndex, onBack, showBack, dense }: FlowHeaderProps) {
  const n = stepIndex + 1;
  const progress = n / CREATE_ORDER_STEPS;
  return (
    <View style={[styles.header, dense && styles.headerDense]}>
      <View style={[styles.topRow, dense && styles.topRowDense]}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, dense && styles.backBtnDense, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <MaterialCommunityIcons name="chevron-left" size={dense ? 20 : 26} color={colors.onBackground} />
          </Pressable>
        ) : (
          <View style={[styles.backPlaceholder, dense && styles.backPlaceholderDense]} />
        )}
        <Text style={[styles.title, dense && styles.titleDense]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.backPlaceholder, dense && styles.backPlaceholderDense]} />
      </View>
      <Text style={[styles.stepLabel, dense && styles.stepLabelDense]}>
        Крок {n} з {CREATE_ORDER_STEPS}
      </Text>
      <View style={[styles.track, dense && styles.trackDense]}>
        <View style={[styles.fill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.sm,
  },
  headerDense: {
    paddingBottom: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  topRowDense: {
    marginBottom: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtnDense: {
    width: 28,
    height: 28,
  },
  backPlaceholder: {
    width: 40,
  },
  backPlaceholderDense: {
    width: 28,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onBackground,
  },
  titleDense: {
    fontSize: typography.fontSize.sm,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepLabelDense: {
    fontSize: 10,
    marginBottom: 4,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackDense: {
    height: 3,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
});
