import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, interaction, radius, spacing, typography } from '../../../theme';

type FlowButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function FlowButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  testID,
}: FlowButtonProps) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primaryBg : styles.secondaryBg,
        inactive && styles.disabled,
        pressed && !inactive && { opacity: interaction.pressedOpacity },
        style,
      ]}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.onBackground} />
          <Text
            style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary, styles.labelPad]}
          >
            {label}
          </Text>
        </View>
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryBg: {
    backgroundColor: colors.primary,
  },
  secondaryBg: {
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: interaction.disabledOpacity,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  labelPrimary: {
    color: colors.onPrimary,
  },
  labelSecondary: {
    color: colors.onBackground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelPad: {
    marginLeft: spacing.sm,
  },
});
