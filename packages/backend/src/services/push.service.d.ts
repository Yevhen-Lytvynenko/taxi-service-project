/**
 * Optional push via Firebase Cloud Messaging legacy HTTP API (server key).
 * Set FCM_SERVER_KEY in environment to enable.
 */
export declare function sendPushToToken(token: string | null | undefined, title: string, body: string, data?: Record<string, string>): Promise<void>;
export declare function notifyUserOrderStatus(pushToken: string | null | undefined, status: string, orderId: string): Promise<void>;
//# sourceMappingURL=push.service.d.ts.map