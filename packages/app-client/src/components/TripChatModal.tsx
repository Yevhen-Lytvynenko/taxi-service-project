import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Socket } from 'socket.io-client';
import api from '../api/axios';
import { colors, spacing, radius, typography } from '../theme';

export type TripChatMessage = {
  id: string;
  role: 'CLIENT' | 'DRIVER';
  text: string;
  sentAt: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  socket: Socket | null;
  myRole: 'CLIENT' | 'DRIVER';
  canSend: boolean;
  emptyHint?: string;
};

export function TripChatModal({
  visible,
  onClose,
  orderId,
  socket,
  myRole,
  canSend,
  emptyHint = 'Ще немає повідомлень.',
}: Props) {
  const [messages, setMessages] = useState<TripChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/chats/order/${orderId}`);
      const raw = (data as { history?: unknown }).history;
      const arr = Array.isArray(raw) ? raw : [];
      const normalized: TripChatMessage[] = arr
        .filter((m: unknown) => m && typeof m === 'object')
        .map((m: any) => {
          const sentAt =
            typeof m.sentAt === 'string' ? m.sentAt : typeof m.at === 'string' ? m.at : new Date().toISOString();
          return {
            id: String(m.id ?? `${sentAt}-${m.role}`),
            role: m.role === 'DRIVER' ? 'DRIVER' : 'CLIENT',
            text: typeof m.text === 'string' ? m.text : '',
            sentAt,
          };
        });
      setMessages(normalized);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      const msg = err.response?.data?.message || err.response?.data?.error || 'Не вдалося завантажити чат';
      Alert.alert('Чат', String(msg));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!visible || !orderId) return;
    void load();
  }, [visible, orderId, load]);

  useEffect(() => {
    if (!visible || !socket || !orderId) return;
    const onMsg = (payload: { message?: TripChatMessage }) => {
      const m = payload?.message;
      if (!m || typeof m.text !== 'string') return;
      const id = m.id ?? `${m.sentAt}-${m.role}`;
      setMessages((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [
          ...prev,
          {
            id,
            role: m.role === 'DRIVER' ? 'DRIVER' : 'CLIENT',
            text: m.text,
            sentAt: typeof m.sentAt === 'string' ? m.sentAt : new Date().toISOString(),
          },
        ];
      });
    };
    socket.on('order_chat_message', onMsg);
    return () => {
      socket.off('order_chat_message', onMsg);
    };
  }, [visible, socket, orderId]);

  const send = useCallback(async () => {
    const t = draft.trim();
    if (!t || !orderId || !canSend || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/chats/order/${orderId}/messages`, { text: t });
      const raw = (data as { history?: unknown }).history;
      if (Array.isArray(raw)) {
        const arr = raw as TripChatMessage[];
        setMessages(
          arr.map((m: any) => ({
            id: String(m.id ?? ''),
            role: m.role === 'DRIVER' ? 'DRIVER' : 'CLIENT',
            text: String(m.text ?? ''),
            sentAt: String(m.sentAt ?? ''),
          }))
        );
      }
      setDraft('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      Alert.alert('Помилка', err.response?.data?.error ?? 'Не надіслано');
    } finally {
      setSending(false);
    }
  }, [draft, orderId, canSend, sending]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Чат поїздки</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Закрити">
            <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.role === myRole;
              return (
                <View style={[styles.bubbleWrap, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleBodyMine : styles.bubbleBodyTheirs]}>
                    <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                      {item.text}
                    </Text>
                    <Text style={styles.time}>
                      {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>{emptyHint}</Text>}
          />
        )}

        <View style={styles.footer}>
          {!canSend ? (
            <Text style={styles.closedHint}>Надсилання недоступне для цього статусу замовлення.</Text>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="Повідомлення…"
                placeholderTextColor={colors.onSurfaceMuted}
                multiline
                maxLength={2000}
                editable={!sending}
              />
              <Pressable
                onPress={() => void send()}
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                disabled={sending || !draft.trim()}
              >
                <MaterialCommunityIcons name="send" size={22} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.onBackground,
  },
  closeBtn: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md, paddingBottom: spacing.lg },
  bubbleWrap: { marginBottom: spacing.sm, maxWidth: '88%' },
  bubbleMine: { alignSelf: 'flex-end' },
  bubbleTheirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleBodyMine: { backgroundColor: colors.primary },
  bubbleBodyTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm },
  bubbleTextMine: { color: colors.onPrimary },
  bubbleTextTheirs: { color: colors.onBackground },
  time: {
    fontSize: 10,
    color: colors.onSurfaceMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.onSurfaceMuted,
    fontFamily: typography.fontFamily.regular,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  closedHint: {
    fontSize: typography.fontSize.sm,
    color: colors.onSurfaceMuted,
    textAlign: 'center',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.onBackground,
    backgroundColor: colors.background,
  },
  sendBtn: {
    backgroundColor: colors.onBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
