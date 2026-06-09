import './types/express-augmentation';
import { createApp } from './createApp';
import { startSearchingOrderTimeoutWatcher } from './jobs/searchingTimeout.job';
import { isDemoResetOnStartEnabled, resetPresentationDemoUsers } from './lib/demoUsersReset';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  if (isDemoResetOnStartEnabled()) {
    await resetPresentationDemoUsers(prisma);
    logger.info('DEMO_RESET_ON_START: демо клієнт/водій — чиста історія та рейтинги');
  }
  const { httpServer } = await createApp();
  startSearchingOrderTimeoutWatcher();
  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT, host: '0.0.0.0' }, 'Server is running');
  });
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});
