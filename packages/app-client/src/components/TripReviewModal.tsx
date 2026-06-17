import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api/axios';
import { colors, spacing, radius, typography } from '../theme';

type TripReviewModalProps = {
  visible: boolean;
  orderId: string;
  /** Кого оцінюємо (ім'я) */
  subjectName: string;
  /** Заголовок, напр. «Оцініть водія» */
  title: string;
  onDone: () => void;
};

export function TripReviewModal({
  visible,
  orderId,
  subjectName,
  title,
  onDone,
}: TripReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSkip = () => {
    setRating(0);
    setComment('');
    setError(null);
    onDone();
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Оберіть кількість зірок');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/reviews', {
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      setRating(0);
      setComment('');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося надіслати відгук');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subjectName}</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setRating(n)}
                style={styles.starHit}
                accessibilityLabel={`${n} зірок`}
              >
                <MaterialCommunityIcons
                  name={n <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={n <= rating ? colors.primary : colors.onSurfaceMuted}
                />
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Коментар (необов'язково)"
            placeholderTextColor={colors.onSurfaceMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            editable={!submitting}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryBtn, submitting && styles.btnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Надіслати</Text>
            )}
          </Pressable>

          <Pressable style={styles.skipBtn} onPress={handleSkip} disabled={submitting}>
            <Text style={styles.skipBtnText}>Пропустити</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  starHit: {
    padding: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.onPrimary,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurfaceMuted,
  },
});
