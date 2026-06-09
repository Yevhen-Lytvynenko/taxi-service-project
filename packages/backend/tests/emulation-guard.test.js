"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Інтеграційні перевірки /api/emulation (потрібні PostgreSQL + seed).
 */
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const createApp_1 = require("../src/createApp");
let app;
const EMULATION_SECRET = process.env.EMULATION_SECRET || 'emulation_secret';
(0, vitest_1.beforeAll)(async () => {
    const { app: a } = await (0, createApp_1.createApp)();
    app = a;
});
(0, vitest_1.describe)('GET /api/emulation/bootstrap', () => {
    (0, vitest_1.it)('403 без X-Emulation-Secret', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/emulation/bootstrap').expect(403);
        (0, vitest_1.expect)(res.body.error).toBeTruthy();
    });
    (0, vitest_1.it)('200 з валідним секретом і тілом bootstrap', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/emulation/bootstrap')
            .set('X-Emulation-Secret', EMULATION_SECRET)
            .expect(200);
        (0, vitest_1.expect)(Array.isArray(res.body.clients)).toBe(true);
        (0, vitest_1.expect)(Array.isArray(res.body.drivers)).toBe(true);
    });
});
//# sourceMappingURL=emulation-guard.test.js.map