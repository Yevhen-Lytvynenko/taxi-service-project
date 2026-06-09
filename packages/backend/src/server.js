"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./types/express-augmentation");
const createApp_1 = require("./createApp");
const searchingTimeout_job_1 = require("./jobs/searchingTimeout.job");
const demoUsersReset_1 = require("./lib/demoUsersReset");
const logger_1 = require("./lib/logger");
const prisma_1 = require("./lib/prisma");
const PORT = Number(process.env.PORT) || 4000;
async function main() {
    if ((0, demoUsersReset_1.isDemoResetOnStartEnabled)()) {
        await (0, demoUsersReset_1.resetPresentationDemoUsers)(prisma_1.prisma);
        logger_1.logger.info('DEMO_RESET_ON_START: демо клієнт/водій — чиста історія та рейтинги');
    }
    const { httpServer } = await (0, createApp_1.createApp)();
    (0, searchingTimeout_job_1.startSearchingOrderTimeoutWatcher)();
    httpServer.listen(PORT, '0.0.0.0', () => {
        logger_1.logger.info({ port: PORT, host: '0.0.0.0' }, 'Server is running');
    });
}
main().catch((e) => {
    logger_1.logger.error(e);
    process.exit(1);
});
//# sourceMappingURL=server.js.map