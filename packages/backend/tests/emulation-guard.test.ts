/**
 * Інтеграційні перевірки /api/emulation (потрібні PostgreSQL + seed).
 */
import request from 'supertest';
import type { Express } from 'express';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp';

let app: Express;
const EMULATION_SECRET = process.env.EMULATION_SECRET || 'emulation_secret';

beforeAll(() => {
  app = createApp().app;
});

describe('GET /api/emulation/bootstrap', () => {
  it('403 без X-Emulation-Secret', async () => {
    const res = await request(app).get('/api/emulation/bootstrap').expect(403);
    expect(res.body.error).toBeTruthy();
  });

  it('200 з валідним секретом і тілом bootstrap', async () => {
    const res = await request(app)
      .get('/api/emulation/bootstrap')
      .set('X-Emulation-Secret', EMULATION_SECRET)
      .expect(200);

    expect(Array.isArray(res.body.clients)).toBe(true);
    expect(Array.isArray(res.body.drivers)).toBe(true);
  });
});
