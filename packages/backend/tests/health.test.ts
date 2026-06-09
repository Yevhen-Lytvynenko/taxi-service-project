import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../src/createApp';

let app: Express;

beforeAll(async () => {
  const { app: a } = await createApp();
  app = a;
});

describe('GET /', () => {
  it('повертає ознаку живого API', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.text).toContain('Taxi Service API');
  });
});
