"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Параметризовані «раунди» для таблиці в звіті ПР7 (it.each).
 * Передумова: prisma db seed (користувач admin / admin).
 */
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const createApp_1 = require("../src/createApp");
let app;
(0, vitest_1.beforeAll)(async () => {
    const { app: a } = await (0, createApp_1.createApp)();
    app = a;
});
const loginRounds = [
    {
        round: 'R1_валідний_admin',
        body: { username: 'admin', password: 'admin' },
        expectStatus: 200,
        expectToken: true,
    },
    {
        round: 'R2_невірний_пароль',
        body: { username: 'admin', password: 'wrong_password' },
        expectStatus: 401,
        expectToken: false,
    },
    {
        round: 'R3_невідомий_користувач',
        body: { username: 'nonexistent_user_xyz', password: 'any' },
        expectStatus: 401,
        expectToken: false,
    },
    {
        round: 'R4_без_пароля',
        body: { username: 'admin' },
        expectStatus: 400,
        expectToken: false,
    },
];
(0, vitest_1.describe)('POST /api/auth/login', () => {
    vitest_1.it.each(loginRounds)('$round', async ({ body, expectStatus, expectToken }) => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/login').send(body);
        (0, vitest_1.expect)(res.status).toBe(expectStatus);
        if (expectToken) {
            (0, vitest_1.expect)(res.body.token).toBeTruthy();
            (0, vitest_1.expect)(res.body.user).toBeDefined();
        }
        else if (expectStatus === 400) {
            (0, vitest_1.expect)(res.body.error).toBeTruthy();
        }
        else {
            (0, vitest_1.expect)(res.body.error).toBeTruthy();
        }
    });
});
//# sourceMappingURL=auth.test.js.map