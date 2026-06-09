"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const createApp_1 = require("../src/createApp");
let app;
(0, vitest_1.beforeAll)(async () => {
    const { app: a } = await (0, createApp_1.createApp)();
    app = a;
});
(0, vitest_1.describe)('GET /', () => {
    (0, vitest_1.it)('повертає ознаку живого API', async () => {
        const res = await (0, supertest_1.default)(app).get('/').expect(200);
        (0, vitest_1.expect)(res.text).toContain('Taxi Service API');
    });
});
//# sourceMappingURL=health.test.js.map