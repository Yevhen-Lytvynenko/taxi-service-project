/**
 * Параметризовані «раунди» для таблиці в звіті ПР7 (it.each).
 * Передумова: prisma db seed (користувач admin / admin).
 */
import request from 'supertest';
import type { Express } from 'express';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp';

let app: Express;

beforeAll(() => {
  app = createApp().app;
});

type LoginRound = {
  round: string;
  body: Record<string, string>;
  expectStatus: number;
  expectToken: boolean;
};

const loginRounds: LoginRound[] = [
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

describe('POST /api/auth/login', () => {
  it.each(loginRounds)('$round', async ({ body, expectStatus, expectToken }) => {
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(expectStatus);
    if (expectToken) {
      expect(res.body.token).toBeTruthy();
      expect(res.body.user).toBeDefined();
    } else if (expectStatus === 400) {
      expect(res.body.error).toBeTruthy();
    } else {
      expect(res.body.error).toBeTruthy();
    }
  });
});
