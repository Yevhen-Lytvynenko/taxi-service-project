import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsCar as DriverIcon,
  Person as ClientIcon,
  Support as AdminIcon,
} from '@mui/icons-material';
import io, { type Socket } from 'socket.io-client';
import api from '../../api/axios';
import { getSocketOriginFromEnv } from '../../config/apiBase';

type Role = 'CLIENT' | 'DRIVER' | 'ADMIN' | string;

type TripChatMessage = {
  id?: string;
  role: Role;
  text: string;
  sentAt?: string;
  at?: string;
};

type TripChatOrderInfo = {
  id?: string;
  status?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  client?: { fullName?: string; phone?: string };
  driver?: { user?: { fullName?: string; phone?: string } };
};

type Props = {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
};

function normalizeMessages(raw: unknown): TripChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const list: TripChatMessage[] = [];
  raw.forEach((m, i) => {
    if (!m || typeof m !== 'object') return;
    const rec = m as Record<string, unknown>;
    const text = typeof rec.text === 'string' ? rec.text : '';
    const sentAt =
      typeof rec.sentAt === 'string'
        ? rec.sentAt
        : typeof rec.at === 'string'
          ? rec.at
          : undefined;
    const role = typeof rec.role === 'string' ? (rec.role as Role) : 'CLIENT';
    list.push({
      id: typeof rec.id === 'string' ? rec.id : `${sentAt ?? ''}-${i}`,
      role,
      text,
      sentAt,
    });
  });
  return list;
}

function formatDateHeader(d: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Сьогодні';
  if (sameDay(d, yesterday)) return 'Учора';
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

type GroupedItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'msg'; key: string; msg: TripChatMessage; date: Date };

function groupByDate(messages: TripChatMessage[]): GroupedItem[] {
  const out: GroupedItem[] = [];
  let lastDateKey = '';
  messages.forEach((m, idx) => {
    const d = m.sentAt ? new Date(m.sentAt) : new Date(0);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (key !== lastDateKey) {
      lastDateKey = key;
      out.push({ kind: 'date', key: `date-${key}`, label: formatDateHeader(d) });
    }
    out.push({ kind: 'msg', key: m.id ?? `m-${idx}`, msg: m, date: d });
  });
  return out;
}

function roleAvatar(role: Role) {
  if (role === 'DRIVER') return <DriverIcon fontSize="small" />;
  if (role === 'ADMIN') return <AdminIcon fontSize="small" />;
  return <ClientIcon fontSize="small" />;
}

function roleLabel(role: Role): string {
  if (role === 'DRIVER') return 'Водій';
  if (role === 'ADMIN') return 'Адміністратор';
  return 'Клієнт';
}

export function TripChatDialog({ orderId, open, onClose }: Props) {
  const [messages, setMessages] = useState<TripChatMessage[]>([]);
  const [order, setOrder] = useState<TripChatOrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const grouped = useMemo(() => groupByDate(messages), [messages]);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/chats/order/${orderId}`);
      const hist = (data as { history?: unknown; order?: TripChatOrderInfo })?.history;
      setMessages(normalizeMessages(hist));
      const ord = (data as { order?: TripChatOrderInfo })?.order ?? null;
      setOrder(ord);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      const msg =
        err.response?.data?.message || err.response?.data?.error || 'Не вдалося завантажити чат';
      setError(String(msg));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!open || !orderId) return;
    void load();
  }, [open, orderId, load]);

  useEffect(() => {
    if (!open || !orderId) return;
    const socket = io(getSocketOriginFromEnv(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join_room', `order_${orderId}`);
    });
    socket.on('order_chat_message', (payload: { message?: TripChatMessage }) => {
      const m = payload?.message;
      if (!m || typeof m.text !== 'string') return;
      setMessages((prev) => {
        const id = m.id ?? `${m.sentAt ?? ''}-${m.role}`;
        if (prev.some((p) => (p.id ?? '') === id)) return prev;
        return [
          ...prev,
          {
            id,
            role: m.role,
            text: m.text,
            sentAt: m.sentAt,
          },
        ];
      });
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [open, orderId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const driverName = order?.driver?.user?.fullName ?? '—';
  const clientName = order?.client?.fullName ?? '—';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span">
            Чат поїздки
          </Typography>
          {order?.id ? (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, fontFamily: 'monospace' }}
            >
              ({order.id.slice(0, 8)}…)
            </Typography>
          ) : null}
          {order?.status ? (
            <Chip size="small" label={order.status} variant="outlined" sx={{ ml: 1 }} />
          ) : null}
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Закрити">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {order ? (
        <Box sx={{ px: 3, pb: 1 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Typography variant="body2">
              <strong>Клієнт:</strong> {clientName}
              {order.client?.phone ? ` · ${order.client.phone}` : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Водій:</strong> {driverName}
              {order.driver?.user?.phone ? ` · ${order.driver.user.phone}` : ''}
            </Typography>
          </Stack>
          {(order.pickupAddress || order.dropoffAddress) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {order.pickupAddress ?? '—'} → {order.dropoffAddress ?? '—'}
            </Typography>
          )}
          <Divider sx={{ mt: 1.5 }} />
        </Box>
      ) : null}

      <DialogContent sx={{ p: 0 }}>
        <Box
          ref={listRef}
          sx={{
            px: 3,
            py: 2,
            maxHeight: '55vh',
            minHeight: 320,
            overflow: 'auto',
            bgcolor: 'grey.50',
          }}
        >
          {loading ? (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : messages.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ mt: 6 }}>
              Немає повідомлень у цій поїздці.
            </Typography>
          ) : (
            grouped.map((item) => {
              if (item.kind === 'date') {
                return (
                  <Box key={item.key} sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                    <Chip label={item.label} size="small" variant="outlined" />
                  </Box>
                );
              }
              const { msg, date } = item;
              const isDriver = msg.role === 'DRIVER';
              return (
                <Box
                  key={item.key}
                  sx={{
                    display: 'flex',
                    justifyContent: isDriver ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Stack
                    direction={isDriver ? 'row-reverse' : 'row'}
                    alignItems="flex-end"
                    spacing={1}
                    sx={{ maxWidth: '78%' }}
                  >
                    <Tooltip title={roleLabel(msg.role)} placement={isDriver ? 'left' : 'right'}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: isDriver ? 'primary.main' : 'grey.300',
                          color: isDriver ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        {roleAvatar(msg.role)}
                      </Avatar>
                    </Tooltip>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: isDriver ? 'primary.light' : 'background.paper',
                        border: '1px solid',
                        borderColor: isDriver ? 'primary.main' : 'divider',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.04)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {msg.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, textAlign: isDriver ? 'right' : 'left' }}
                      >
                        {roleLabel(msg.role)} · {msg.sentAt ? formatTime(date) : '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
