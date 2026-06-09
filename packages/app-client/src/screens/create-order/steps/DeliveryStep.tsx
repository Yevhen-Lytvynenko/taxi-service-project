import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, interaction, radius, spacing, typography } from '../../../theme';
import { FlowTextField } from '../components/FlowTextField';

export type DeliveryPayerCode = 'SENDER' | 'RECIPIENT' | 'CLIENT';

type DeliveryStepProps = {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  payer: DeliveryPayerCode | null;
  onSenderName: (v: string) => void;
  onSenderPhone: (v: string) => void;
  onRecipientName: (v: string) => void;
  onRecipientPhone: (v: string) => void;
  onPayer: (v: DeliveryPayerCode) => void;
};

const PAYERS: { code: DeliveryPayerCode; label: string }[] = [
  { code: 'SENDER', label: 'Відправник' },
  { code: 'RECIPIENT', label: 'Отримувач' },
  { code: 'CLIENT', label: 'Я (замовник)' },
];

export function DeliveryStep({
  senderName,
  senderPhone,
  recipientName,
  recipientPhone,
  payer,
  onSenderName,
  onSenderPhone,
  onRecipientName,
  onRecipientPhone,
  onPayer,
}: DeliveryStepProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Доставка</Text>
      <Text style={styles.hint}>Вкажіть контакти та хто оплачує послугу</Text>

      <Text style={styles.groupLabel}>Відправник</Text>
      <FlowTextField
        variant="underline"
        placeholder="Ім’я"
        value={senderName}
        onChangeText={onSenderName}
        autoCapitalize="words"
      />
      <FlowTextField
        variant="underline"
        placeholder="Телефон"
        value={senderPhone}
        onChangeText={onSenderPhone}
        keyboardType="phone-pad"
        style={styles.fieldGap}
      />

      <Text style={[styles.groupLabel, styles.groupPad]}>Отримувач</Text>
      <FlowTextField
        variant="underline"
        placeholder="Ім’я"
        value={recipientName}
        onChangeText={onRecipientName}
        autoCapitalize="words"
      />
      <FlowTextField
        variant="underline"
        placeholder="Телефон"
        value={recipientPhone}
        onChangeText={onRecipientPhone}
        keyboardType="phone-pad"
        style={styles.fieldGap}
      />

      <Text style={[styles.groupLabel, styles.groupPad]}>Хто платить</Text>
      <View style={styles.payerRow}>
        {PAYERS.map(({ code, label }) => {
          const on = payer === code;
          return (
            <Pressable
              key={code}
              onPress={() => onPayer(code)}
              style={({ pressed }) => [
                styles.payerChip,
                on && styles.payerChipOn,
                pressed && { opacity: interaction.pressedOpacity },
              ]}
            >
              <Text style={[styles.payerChipText, on && styles.payerChipTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  hint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    marginBottom: spacing.md,
  },
  groupLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    marginBottom: spacing.xs,
  },
  groupPad: {
    marginTop: spacing.md,
  },
  fieldGap: {
    marginTop: spacing.sm,
  },
  payerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  payerChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  payerChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundMuted,
  },
  payerChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.onBackground,
  },
  payerChipTextOn: {
    color: colors.primary,
  },
});
