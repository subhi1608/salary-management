import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app';
import { getTestPool } from '../../setup';
import { config } from '../../../src/config';

function makeToken(userId = 'test-user-id') {
  return jwt.sign({ sub: userId, email: 'hr@test.com' }, config.jwtSecret, { expiresIn: '1h' });
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function insertEmployee(overrides: Record<string, unknown> = {}) {
  const pool = getTestPool();
  const dept = await pool.query('SELECT id FROM departments WHERE name = $1', ['Engineering']);
  const defaults: Record<string, unknown> = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: `jane.doe.${Date.now()}@company.com`,
    job_title: 'Software Engineer',
    department_id: dept.rows[0].id,
    country: 'US',
    salary: 100000,
    employment_type: 'full_time',
    hire_date: '2022-01-15',
    ...overrides,
  };
  const res = await pool.query(
    `INSERT INTO employees (first_name, last_name, email, job_title, department_id, country, salary, employment_type, hire_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    Object.values(defaults)
  );
  return { ...defaults, id: res.rows[0].id };
}

describe('GET /api/v1/employees', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => { app = createApp(getTestPool()); });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(401);
  });

  it('returns paginated employees', async () => {
    await insertEmployee();
    await insertEmployee({ first_name: 'John', last_name: 'Smith', email: 'john.smith@company.com' });
    const res = await request(app)
      .get('/api/v1/employees?page=1&limit=10')
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.employees).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
  });

  it('filters by country', async () => {
    await insertEmployee({ country: 'US' });
    await insertEmployee({ first_name: 'Anna', last_name: 'Müller', email: 'anna@company.com', country: 'DE' });
    const res = await request(app)
      .get('/api/v1/employees?country=US')
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.employees).toHaveLength(1);
    expect(res.body.data.employees[0].country).toBe('US');
  });

  it('filters by is_active=false', async () => {
    await insertEmployee();
    const inactive = await insertEmployee({ first_name: 'Old', last_name: 'Employee', email: 'old@company.com' });
    await getTestPool().query('UPDATE employees SET is_active=false WHERE id=$1', [inactive.id]);

    const res = await request(app)
      .get('/api/v1/employees?is_active=false')
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.employees).toHaveLength(1);
  });
});

describe('POST /api/v1/employees', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => { app = createApp(getTestPool()); });

  it('creates an employee and returns 201', async () => {
    const dept = await getTestPool().query('SELECT id FROM departments WHERE name=$1', ['Engineering']);
    const res = await request(app)
      .post('/api/v1/employees')
      .set(authHeader(makeToken()))
      .send({
        first_name: 'Alice',
        last_name: 'Wong',
        email: 'alice.wong@company.com',
        job_title: 'Software Engineer',
        department_id: dept.rows[0].id,
        country: 'US',
        salary: 120000,
        employment_type: 'full_time',
        hire_date: '2023-03-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('alice.wong@company.com');
    expect(res.body.data.is_active).toBe(true);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set(authHeader(makeToken()))
      .send({ first_name: 'Alice' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/employees/:id', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => { app = createApp(getTestPool()); });

  it('updates salary and returns updated employee', async () => {
    const emp = await insertEmployee();
    const res = await request(app)
      .patch(`/api/v1/employees/${emp.id}`)
      .set(authHeader(makeToken()))
      .send({ salary: 130000 });

    expect(res.status).toBe(200);
    expect(res.body.data.salary).toBe(130000);
  });

  it('returns 404 for non-existent employee', async () => {
    const res = await request(app)
      .patch('/api/v1/employees/00000000-0000-0000-0000-000000000000')
      .set(authHeader(makeToken()))
      .send({ salary: 50000 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/employees/:id', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => { app = createApp(getTestPool()); });

  it('soft-deletes: sets is_active=false and termination_date', async () => {
    const emp = await insertEmployee();
    const res = await request(app)
      .delete(`/api/v1/employees/${emp.id}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
    expect(res.body.data.termination_date).not.toBeNull();
  });
});
