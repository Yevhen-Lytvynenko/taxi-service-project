import type { Server } from 'socket.io';
import { getRedisUrl } from '../config/env';
import { logger } from '../lib/logger';

/** Optional horizontal scaling for Socket.IO when REDIS_URL is set. */
export async function attachRedisAdapterIfConfigured(io: Server): Promise<void> {
  const url = getRedisUrl();
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
    logger.info('Socket.IO Redis adapter enabled');
  } catch (e) {
    logger.error({ err: e }, 'Failed to enable Redis adapter; continuing single-instance');
  }
}
