import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, type TextInputProps } from 'react-native';
import { colors, interaction, radius, spacing, typography } from '../../../theme';

type FlowTextFieldProps = TextInputProps & {
  loading?: boolean;
  /** `underline` — мінімальне поле підпису (як у таксі), без сірого фону */
  variant?: 'filled' | 'underline';
};

export function FlowTextField({
  loading,
  style,
  editable = true,
  variant = 'filled',
  onFocus,
  onBlur,
  ...rest
}: FlowTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const isUnderline = variant === 'underline';
  return (
    <View style={styles.wrap}>
      <TextInput
        {...rest}
        editable={editable && !loading}
        placeholderTextColor={colors.onSurfaceMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          isUnderline ? styles.inputUnderline : styles.input,
          isUnderline
            ? loading
              ? styles.inputUnderlineWithLoader
              : styles.inputUnderlineNoLoader
            : loading
              ? styles.inputWithLoader
              : styles.inputNoLoader,
          !isUnderline && focused && styles.inputFocused,
          isUnderline && focused && styles.inputUnderlineFocused,
          !editable && { opacity: interaction.disabledOpacity },
          style,
        ]}
      />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.backgroundMuted,
    color: colors.onBackground,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputNoLoader: {
    paddingRight: spacing.md,
  },
  inputWithLoader: {
    paddingRight: 44,
  },
  inputFocused: {
    borderColor: colors.focusBorder,
    backgroundColor: colors.surface,
  },
  inputUnderline: {
    backgroundColor: 'transparent',
    color: colors.onBackground,
    paddingVertical: 4,
    paddingHorizontal: 0,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    borderWidth: 0,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 26,
  },
  inputUnderlineNoLoader: {
    paddingRight: 0,
  },
  inputUnderlineWithLoader: {
    paddingRight: 36,
  },
  inputUnderlineFocused: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
  },
  loader: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
