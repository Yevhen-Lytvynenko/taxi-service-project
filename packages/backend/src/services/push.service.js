"use strict";
/**
 * Optional push via Firebase Cloud Messaging legacy HTTP API (server key).
 * Set FCM_SERVER_KEY in environment to enable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToToken = sendPushToToken;
exports.notifyUserOrderStatus = notifyUserOrderStatus;
const logger_1 = require("../lib/logger");
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';
async function sendPushToToken(token, title, body, data) {
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
            logger_1.logger.warn({ status: res.status, text }, 'FCM request failed');
        }
    }
    catch (e) {
        logger_1.logger.warn({ err: e }, 'FCM send error');
    }
}
async function notifyUserOrderStatus(pushToken, status, orderId) {
    await sendPushToToken(pushToken, 'Замовлення', `Статус: ${status}`, {
        orderId,
        status,
    });
}
//# sourceMappingURL=push.service.js.map