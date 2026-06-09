/**
 * Optional push via Firebase Cloud Messaging legacy HTTP API (server key).
 * Set FCM_SERVER_KEY in environment to enable.
 */

import { logger } from '../lib/logger';

const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

export async function sendPushToToken(
  token: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const key = process.env.FCM_SERVER_KEY?.trim();
  if (!key || !token) {
    return;
  }

  try {
    const res = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        Authorization: `key=${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body },
        data: data ?? {},
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ status: res.status, text }, 'FCM request failed');
    }
  } catch (e) {
    logger.warn({ err: e }, 'FCM send error');
  }
}

export async function notifyUserOrderStatus(
  pushToken: string | null | undefined,
  status: string,
  orderId: string
): Promise<void> {
  await sendPushToToken(pushToken, 'Замовлення', `Статус: ${status}`, {
    orderId,
    status,
  });
}
