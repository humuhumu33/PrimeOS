import request from 'supertest';
import { createServer } from './index';

describe('chess-web endpoints', () => {
  let app: any;
  beforeAll(async () => {
    app = await createServer();
  });

  test('GET /api/board', async () => {
    const res = await request(app).get('/api/board');
    expect(res.status).toBe(200);
    expect(res.body.board).toBeDefined();
  });

  test('POST /api/new-game', async () => {
    const res = await request(app).post('/api/new-game');
    expect(res.status).toBe(200);
    expect(res.body.board).toBeDefined();
  });

  test('POST /api/player-move', async () => {
    const res = await request(app).post('/api/player-move').send({ from: 'e2', to: 'e4', promotion: 'q' });
    expect(res.status).toBe(200);
    expect(res.body.board).toBeDefined();
    expect(res.body).toHaveProperty('gameOver');
  });
});
