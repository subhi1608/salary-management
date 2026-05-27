import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app';
import { getTestPool } from '../../setup';
import { config } from '../../../src/config';

function makeToken() {
  return jwt.sign({ sub: 'uid', email: 'hr@test.com' }, config.jwtSecret, { expiresIn: '1h' });
}

async function seedInsightData() {
  const pool = getTestPool();
  const dept = await pool.query('SELECT id FROM departments WHERE name=$1', ['Engineering']);
  const deptId = dept.rows[0].id;
  await pool.query(`
    INSERT INTO employees (first_name, last_name, email, job_title, department_id, country, salary, employment_type, hire_date)
    VALUES
      ('A','B','a@c.com','Software Engineer',$1,'US',120000,'full_time','2022-01-01'),
      ('C','D','c@c.com','Software Engineer',$1,'US',100000,'full_time','2022-01-01'),
      ('E','F','e@c.com','Data Analyst',$1,'IN',15000,'full_time','2022-01-01')
  `, [deptId]);
}

describe('GET /api/v1/insights/summary', () => {
  let app: ReturnType<typeof createApp>;
  beforeAll(() => { app = createApp(getTestPool()); });
  beforeEach(seedInsightData);

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/insights/summary');
    expect(res.status).toBe(401);
  });

  it('returns summary stats', async () => {
    const res = await request(app)
      .get('/api/v1/insights/summary')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total_employees).toBe(3);
    expect(res.body.data.active_employees).toBe(3);
    expect(res.body.data.avg_salary).toBeGreaterThan(0);
  });
});

describe('GET /api/v1/insights/salary-by-country', () => {
  let app: ReturnType<typeof createApp>;
  beforeAll(() => { app = createApp(getTestPool()); });
  beforeEach(seedInsightData);

  it('returns min/max/avg salary per country', async () => {
    const res = await request(app)
      .get('/api/v1/insights/salary-by-country')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const us = res.body.data.find((r: { country: string }) => r.country === 'US');
    expect(us.min_salary).toBe(100000);
    expect(us.max_salary).toBe(120000);
    expect(us.avg_salary).toBe(110000);
  });
});

describe('GET /api/v1/insights/salary-by-jobtitle', () => {
  let app: ReturnType<typeof createApp>;
  beforeAll(() => { app = createApp(getTestPool()); });
  beforeEach(seedInsightData);

  it('returns avg salary by job title for given country', async () => {
    const res = await request(app)
      .get('/api/v1/insights/salary-by-jobtitle?country=US')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const eng = res.body.data.find((r: { job_title: string }) => r.job_title === 'Software Engineer');
    expect(eng.avg_salary).toBe(110000);
  });

  it('returns 400 if country param is missing', async () => {
    const res = await request(app)
      .get('/api/v1/insights/salary-by-jobtitle')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });
});
