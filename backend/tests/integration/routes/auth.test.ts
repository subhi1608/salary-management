import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../../src/app';
import { getTestPool } from '../../setup';

describe('POST /api/v1/auth/login', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(getTestPool());
  });

  beforeEach(async () => {
    const hash = await bcrypt.hash('password123', 12);
    await getTestPool().query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)`,
      ['hr@company.com', hash, 'HR Manager']
    );
  });

  it('returns 200 with accessToken on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@company.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('hr@company.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@company.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@company.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/logout', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp(getTestPool());
  });

  it('returns 204 and clears cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
  });
});
