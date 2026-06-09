"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachRedisAdapterIfConfigured = attachRedisAdapterIfConfigured;
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
/** Optional horizontal scaling for Socket.IO when REDIS_URL is set. */
async function attachRedisAdapterIfConfigured(io) {
    const url = (0, env_1.getRedisUrl)();
    if (!url) {
        return;
    }
    try {
        const { createClient } = await import('redis');
        const { createAdapter } = await import('@socket.io/redis-adapter');
        const pubClient = createClient({ url });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        logger_1.logger.info('Socket.IO Redis adapter enabled');
    }
    catch (e) {
        logger_1.logger.error({ err: e }, 'Failed to enable Redis adapter; continuing single-instance');
    }
}
//# sourceMappingURL=socketRedis.js.map