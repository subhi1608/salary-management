# Salary Management Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack salary management tool with employee CRUD, salary insights, and HR authentication.

**Architecture:** Monorepo with `backend/` (Express + PostgreSQL) and `frontend/` (React + Vite + MUI). App factory pattern (`createApp(pool)`) keeps Express testable without a live server. TDD throughout — red commit → green commit → refactor commit.

**Tech Stack:** Node.js + Express + TypeScript + PostgreSQL (`pg`) + JWT + bcryptjs + Zod + Pino + Helmet (BE); React 18 + Vite + TypeScript + MUI + TanStack Router/Query + Zustand + React Hook Form + Zod (FE); Jest + Supertest (BE); Vitest + React Testing Library (FE).

---

## File Map

```
salary-management/
├── backend/
│   ├── src/
│   │   ├── config/index.ts
│   │   ├── db/pool.ts, migrate.ts, migrations/*.sql
│   │   ├── types/index.ts
│   │   ├── utils/pagination.ts
│   │   ├── middleware/authenticate.ts, errorHandler.ts, rateLimiter.ts
│   │   ├── repositories/userRepository.ts, employeeRepository.ts, insightRepository.ts
│   │   ├── services/authService.ts, employeeService.ts, insightService.ts
│   │   ├── controllers/authController.ts, employeeController.ts, insightController.ts
│   │   ├── routes/auth.ts, employees.ts, insights.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── seeds/seed.ts, first_names.txt, last_names.txt, data/*.ts
│   ├── tests/setup.ts, unit/**, integration/**
│   ├── package.json, tsconfig.json, jest.config.ts, .env.example
├── frontend/
│   ├── src/
│   │   ├── types/index.ts
│   │   ├── lib/formatCurrency.ts, constants.ts
│   │   ├── api/client.ts
│   │   ├── store/authStore.ts
│   │   ├── router/index.tsx
│   │   ├── components/PageLayout.tsx, StatCard.tsx
│   │   ├── services/auth.ts, employees.ts, insights.ts
│   │   ├── features/auth/**, employees/**, insights/**
│   │   └── pages/Login.tsx, Employees.tsx, Insights.tsx
│   ├── package.json, tsconfig.json, vite.config.ts, vitest.config.ts
├── docker-compose.yml
└── .env.example
```

---

## Task 1: Backend — Project Scaffolding & Shared Types

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/jest.config.ts`
- Create: `backend/.env.example`
- Create: `backend/src/config/index.ts`
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "salary-management-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand",
    "test:unit": "jest --runInBand tests/unit",
    "test:integration": "jest --runInBand tests/integration",
    "migrate": "tsx src/db/migrate.ts",
    "seed": "tsx seeds/seed.ts"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "pino": "^8.15.6",
    "pino-pretty": "^10.2.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/pg": "^8.10.9",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.1",
    "tsx": "^4.6.2",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "seeds/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `backend/jest.config.ts`**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterFramework: ['./tests/setup.ts'],
  globalSetup: './tests/globalSetup.ts',
  globalTeardown: './tests/globalTeardown.ts',
  testTimeout: 30000,
};

export default config;
```

- [ ] **Step 4: Create `backend/.env.example`**

```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/salary_management
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/salary_management_test
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

- [ ] **Step 5: Create `backend/src/config/index.ts`**

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL!,
  testDatabaseUrl: process.env.TEST_DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
};
```

- [ ] **Step 6: Create `backend/src/types/index.ts`**

```typescript
export type EmploymentType = 'full_time' | 'part_time' | 'contractor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  job_title: string;
  department_id: number;
  country: string;
  salary: number;
  employment_type: EmploymentType;
  hire_date: string;
  is_active: boolean;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department_id: number;
  country: string;
  salary: number;
  employment_type: EmploymentType;
  hire_date: string;
}

export interface UpdateEmployeeInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  department_id?: number;
  country?: string;
  salary?: number;
  employment_type?: EmploymentType;
  hire_date?: string;
}

export interface EmployeeFilters {
  country?: string;
  job_title?: string;
  is_active?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedEmployees {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalaryByCountry {
  country: string;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
  employee_count: number;
}

export interface SalaryByJobTitle {
  job_title: string;
  avg_salary: number;
  employee_count: number;
}

export interface InsightSummary {
  total_employees: number;
  active_employees: number;
  former_employees: number;
  avg_salary: number;
  headcount_by_country: Array<{ country: string; count: number }>;
  headcount_by_department: Array<{ department: string; count: number }>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

- [ ] **Step 7: Install dependencies and verify TypeScript compiles**

```bash
cd backend && npm install
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/jest.config.ts backend/.env.example backend/src/config/index.ts backend/src/types/index.ts
git commit -m "feat(backend): project scaffolding and shared types"
```

---

## Task 2: Backend — Database Setup

**Files:**
- Create: `backend/src/db/pool.ts`
- Create: `backend/src/db/migrate.ts`
- Create: `backend/src/db/migrations/001_create_extensions.sql`
- Create: `backend/src/db/migrations/002_create_users.sql`
- Create: `backend/src/db/migrations/003_create_departments.sql`
- Create: `backend/src/db/migrations/004_create_employees.sql`

- [ ] **Step 1: Create `backend/src/db/pool.ts`**

```typescript
import { Pool } from 'pg';
import { config } from '../config';

export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export const pool = createPool(config.databaseUrl);
```

- [ ] **Step 2: Create `backend/src/db/migrations/001_create_extensions.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

- [ ] **Step 3: Create `backend/src/db/migrations/002_create_users.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 4: Create `backend/src/db/migrations/003_create_departments.sql`**

```sql
CREATE TABLE IF NOT EXISTS departments (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO departments (name) VALUES
  ('Engineering'),
  ('Sales'),
  ('HR'),
  ('Finance'),
  ('Marketing'),
  ('Operations'),
  ('Legal'),
  ('Product')
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 5: Create `backend/src/db/migrations/004_create_employees.sql`**

```sql
CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  full_name        VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email            VARCHAR(255) UNIQUE NOT NULL,
  job_title        VARCHAR(150) NOT NULL,
  department_id    INTEGER REFERENCES departments(id),
  country          VARCHAR(100) NOT NULL,
  salary           NUMERIC(12, 2) NOT NULL,
  employment_type  VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
  hire_date        DATE NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  termination_date DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_country       ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_job_title     ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_employees_country_title ON employees(country, job_title);
CREATE INDEX IF NOT EXISTS idx_employees_is_active     ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_full_name     ON employees USING gin(full_name gin_trgm_ops);
```

- [ ] **Step 6: Create `backend/src/db/migrate.ts`**

```typescript
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations(pool: Pool): Promise<void> {
  const files = fs.readdirSync(MIGRATIONS_DIR).sort();
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    await pool.query(sql);
  }
}

if (require.main === module) {
  const { createPool } = require('./pool');
  const { config } = require('../config');
  const pool = createPool(config.databaseUrl);
  runMigrations(pool)
    .then(() => { console.log('Migrations complete'); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}
```

- [ ] **Step 7: Copy `.env.example` to `.env`, fill in values, run migrations**

```bash
cp backend/.env.example backend/.env
# Edit .env with your real Postgres credentials, then:
cd backend && npm run migrate
```

Expected: `Migrations complete`

- [ ] **Step 8: Commit**

```bash
git add backend/src/db/
git commit -m "feat(backend): database pool and migrations"
```

---

## Task 3: Backend — Express App + Middleware

**Files:**
- Create: `backend/src/middleware/errorHandler.ts`
- Create: `backend/src/middleware/rateLimiter.ts`
- Create: `backend/src/middleware/authenticate.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/index.ts`
- Create: `backend/tests/globalSetup.ts`
- Create: `backend/tests/globalTeardown.ts`
- Create: `backend/tests/setup.ts`

- [ ] **Step 1: Create `backend/src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
```

- [ ] **Step 2: Create `backend/src/middleware/rateLimiter.ts`**

```typescript
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
```

- [ ] **Step 3: Create `backend/src/middleware/authenticate.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError, AuthTokenPayload } from '../types';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Missing token', 401));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
}
```

- [ ] **Step 4: Create `backend/src/app.ts`**

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth';
import { createEmployeeRouter } from './routes/employees';
import { createInsightRouter } from './routes/insights';
import { config } from './config';

export function createApp(pool: Pool) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/auth', createAuthRouter(pool));
  app.use('/api/v1/employees', createEmployeeRouter(pool));
  app.use('/api/v1/insights', createInsightRouter(pool));

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 5: Create `backend/src/index.ts`**

```typescript
import { createPool } from './db/pool';
import { createApp } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';

async function main() {
  const pool = createPool(config.databaseUrl);
  await runMigrations(pool);
  const app = createApp(pool);
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 6: Create `backend/tests/globalSetup.ts`**

```typescript
import { createPool } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { config } from '../src/config';

export default async function globalSetup() {
  const pool = createPool(config.testDatabaseUrl);
  await runMigrations(pool);
  await pool.end();
}
```

- [ ] **Step 7: Create `backend/tests/globalTeardown.ts`**

```typescript
export default async function globalTeardown() {}
```

- [ ] **Step 8: Create `backend/tests/setup.ts`**

```typescript
import { Pool } from 'pg';
import { createPool } from '../src/db/pool';
import { config } from '../src/config';

let testPool: Pool;

export function getTestPool(): Pool {
  return testPool;
}

beforeAll(() => {
  testPool = createPool(config.testDatabaseUrl);
});

afterEach(async () => {
  await testPool.query(
    'TRUNCATE employees, users, departments RESTART IDENTITY CASCADE'
  );
  // Re-seed departments (truncate removes them)
  await testPool.query(`
    INSERT INTO departments (name) VALUES
      ('Engineering'),('Sales'),('HR'),('Finance'),
      ('Marketing'),('Operations'),('Legal'),('Product')
    ON CONFLICT (name) DO NOTHING
  `);
});

afterAll(async () => {
  await testPool.end();
});
```

- [ ] **Step 9: Update `backend/jest.config.ts`** (fix the typo from Task 1)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterFramework: ['./tests/setup.ts'],
  globalSetup: './tests/globalSetup.ts',
  globalTeardown: './tests/globalTeardown.ts',
  testTimeout: 30000,
};

export default config;
```

Replace `setupFilesAfterFramework` with `setupFilesAfterEnv`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  globalSetup: './tests/globalSetup.ts',
  globalTeardown: './tests/globalTeardown.ts',
  testTimeout: 30000,
};

export default config;
```

- [ ] **Step 10: Commit**

```bash
git add backend/src/middleware/ backend/src/app.ts backend/src/index.ts backend/tests/
git commit -m "feat(backend): express app factory and test infrastructure"
```

---

## Task 4: Backend — Auth (TDD)

**Files:**
- Create: `backend/src/repositories/userRepository.ts`
- Create: `backend/src/services/authService.ts`
- Create: `backend/src/controllers/authController.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/tests/integration/routes/auth.test.ts`

- [ ] **Step 1: Write failing integration test for auth routes**

Create `backend/tests/integration/routes/auth.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd backend && npm test tests/integration/routes/auth.test.ts
```

Expected: FAIL — `createAuthRouter is not a function` (routes not yet created).

- [ ] **Step 3: Create `backend/src/repositories/userRepository.ts`**

```typescript
import { Pool } from 'pg';
import { User } from '../types';

export async function findUserByEmail(pool: Pool, email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await pool.query(
    'SELECT id, email, full_name, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}
```

- [ ] **Step 4: Create `backend/src/services/authService.ts`**

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { config } from '../config';
import { AppError, LoginInput, User } from '../types';
import { findUserByEmail } from '../repositories/userRepository';

export async function login(
  pool: Pool,
  input: LoginInput
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  const user = await findUserByEmail(pool, input.email);
  if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );

  const { password_hash: _, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

export function refreshAccessToken(refreshToken: string): string {
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as { sub: string };
    return jwt.sign({ sub: payload.sub }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  }
}
```

- [ ] **Step 5: Create `backend/src/controllers/authController.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { login, refreshAccessToken } from '../services/authService';
import { AppError } from '../types';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createAuthController(pool: Pool) {
  return {
    async loginHandler(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
        }
        const { accessToken, refreshToken, user } = await login(pool, parsed.data);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        res.json({ data: { accessToken, user } });
      } catch (err) {
        next(err);
      }
    },

    async refreshHandler(req: Request, res: Response, next: NextFunction) {
      try {
        const token = req.cookies[REFRESH_COOKIE];
        if (!token) throw new AppError('UNAUTHORIZED', 'No refresh token', 401);
        const accessToken = refreshAccessToken(token);
        res.json({ data: { accessToken } });
      } catch (err) {
        next(err);
      }
    },

    logoutHandler(_req: Request, res: Response) {
      res.clearCookie(REFRESH_COOKIE);
      res.status(204).send();
    },
  };
}
```

- [ ] **Step 6: Create `backend/src/routes/auth.ts`**

```typescript
import { Router } from 'express';
import { Pool } from 'pg';
import { authRateLimiter } from '../middleware/rateLimiter';
import { createAuthController } from '../controllers/authController';

export function createAuthRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createAuthController(pool);

  router.post('/login', authRateLimiter, ctrl.loginHandler.bind(ctrl));
  router.post('/refresh', ctrl.refreshHandler.bind(ctrl));
  router.post('/logout', ctrl.logoutHandler.bind(ctrl));

  return router;
}
```

- [ ] **Step 7: Run auth tests — verify they pass**

```bash
cd backend && npm test tests/integration/routes/auth.test.ts
```

Expected: PASS — 5 tests passing.

- [ ] **Step 8: Commit**

```bash
git add backend/src/repositories/userRepository.ts backend/src/services/authService.ts backend/src/controllers/authController.ts backend/src/routes/auth.ts backend/tests/integration/routes/auth.test.ts
git commit -m "feat(backend): auth routes with TDD - login, refresh, logout"
```

---

## Task 5: Backend — Employees (TDD)

**Files:**
- Create: `backend/src/repositories/employeeRepository.ts`
- Create: `backend/src/services/employeeService.ts`
- Create: `backend/src/controllers/employeeController.ts`
- Create: `backend/src/routes/employees.ts`
- Create: `backend/tests/integration/routes/employees.test.ts`
- Create: `backend/tests/unit/services/employeeService.test.ts`

- [ ] **Step 1: Write failing unit tests for employeeService**

Create `backend/tests/unit/services/employeeService.test.ts`:

```typescript
import { buildEmployeeFiltersQuery } from '../../../src/services/employeeService';

describe('buildEmployeeFiltersQuery', () => {
  it('returns base query with no filters', () => {
    const { where, params } = buildEmployeeFiltersQuery({});
    expect(where).toBe('WHERE 1=1');
    expect(params).toEqual([]);
  });

  it('adds country filter', () => {
    const { where, params } = buildEmployeeFiltersQuery({ country: 'US' });
    expect(where).toContain('country = $1');
    expect(params).toEqual(['US']);
  });

  it('adds is_active filter', () => {
    const { where, params } = buildEmployeeFiltersQuery({ is_active: false });
    expect(where).toContain('is_active = $1');
    expect(params).toEqual([false]);
  });

  it('adds search filter using ILIKE', () => {
    const { where, params } = buildEmployeeFiltersQuery({ search: 'john' });
    expect(where).toContain('full_name ILIKE $1');
    expect(params).toEqual(['%john%']);
  });

  it('combines multiple filters', () => {
    const { where, params } = buildEmployeeFiltersQuery({ country: 'US', is_active: true });
    expect(where).toContain('country = $1');
    expect(where).toContain('is_active = $2');
    expect(params).toEqual(['US', true]);
  });
});
```

- [ ] **Step 2: Run unit test — verify it fails**

```bash
cd backend && npm run test:unit tests/unit/services/employeeService.test.ts
```

Expected: FAIL — `buildEmployeeFiltersQuery is not a function`.

- [ ] **Step 3: Write failing integration tests for employee routes**

Create `backend/tests/integration/routes/employees.test.ts`:

```typescript
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

async function insertEmployee(overrides = {}) {
  const pool = getTestPool();
  const dept = await pool.query('SELECT id FROM departments WHERE name = $1', ['Engineering']);
  const defaults = {
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
```

- [ ] **Step 4: Run integration tests — verify they fail**

```bash
cd backend && npm test tests/integration/routes/employees.test.ts
```

Expected: FAIL — `createEmployeeRouter is not a function`.

- [ ] **Step 5: Create `backend/src/repositories/employeeRepository.ts`**

```typescript
import { Pool } from 'pg';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput, EmployeeFilters, PaginatedEmployees } from '../types';

function mapRow(row: Record<string, unknown>): Employee {
  return {
    ...row,
    salary: parseFloat(row.salary as string),
  } as Employee;
}

export async function findEmployees(
  pool: Pool,
  where: string,
  params: unknown[],
  page: number,
  limit: number
): Promise<PaginatedEmployees> {
  const offset = (page - 1) * limit;
  const countResult = await pool.query(`SELECT COUNT(*) FROM employees ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await pool.query(
    `SELECT e.*, d.name as department_name FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     ${where} ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    employees: dataResult.rows.map(mapRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findEmployeeById(pool: Pool, id: string): Promise<Employee | null> {
  const result = await pool.query(
    `SELECT e.*, d.name as department_name FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE e.id = $1`,
    [id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createEmployee(pool: Pool, input: CreateEmployeeInput): Promise<Employee> {
  const result = await pool.query(
    `INSERT INTO employees (first_name, last_name, email, job_title, department_id, country, salary, employment_type, hire_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [input.first_name, input.last_name, input.email, input.job_title, input.department_id,
     input.country, input.salary, input.employment_type, input.hire_date]
  );
  return mapRow(result.rows[0]);
}

export async function updateEmployee(pool: Pool, id: string, input: UpdateEmployeeInput): Promise<Employee | null> {
  const fields = Object.keys(input).filter(k => (input as Record<string, unknown>)[k] !== undefined);
  if (fields.length === 0) return findEmployeeById(pool, id);

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => (input as Record<string, unknown>)[f]);

  const result = await pool.query(
    `UPDATE employees SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function softDeleteEmployee(pool: Pool, id: string): Promise<Employee | null> {
  const result = await pool.query(
    `UPDATE employees SET is_active = false, termination_date = CURRENT_DATE, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
```

- [ ] **Step 6: Create `backend/src/services/employeeService.ts`**

```typescript
import { Pool } from 'pg';
import { z } from 'zod';
import { CreateEmployeeInput, Employee, EmployeeFilters, PaginatedEmployees, UpdateEmployeeInput, AppError } from '../types';
import * as repo from '../repositories/employeeRepository';

export const CreateEmployeeSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  job_title: z.string().min(1).max(150),
  department_id: z.number().int().positive(),
  country: z.string().min(1).max(100),
  salary: z.number().positive(),
  employment_type: z.enum(['full_time', 'part_time', 'contractor']),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export interface FilterQuery {
  where: string;
  params: unknown[];
}

export function buildEmployeeFiltersQuery(
  filters: Omit<EmployeeFilters, 'page' | 'limit'>
): FilterQuery {
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (filters.country !== undefined) {
    params.push(filters.country);
    conditions.push(`country = $${params.length}`);
  }
  if (filters.job_title !== undefined) {
    params.push(filters.job_title);
    conditions.push(`job_title = $${params.length}`);
  }
  if (filters.is_active !== undefined) {
    params.push(filters.is_active);
    conditions.push(`is_active = $${params.length}`);
  }
  if (filters.search !== undefined) {
    params.push(`%${filters.search}%`);
    conditions.push(`full_name ILIKE $${params.length}`);
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, params };
}

export async function listEmployees(pool: Pool, filters: EmployeeFilters): Promise<PaginatedEmployees> {
  const { where, params } = buildEmployeeFiltersQuery(filters);
  return repo.findEmployees(pool, where, params, filters.page, filters.limit);
}

export async function getEmployee(pool: Pool, id: string): Promise<Employee> {
  const emp = await repo.findEmployeeById(pool, id);
  if (!emp) throw new AppError('NOT_FOUND', 'Employee not found', 404);
  return emp;
}

export async function createEmployee(pool: Pool, input: CreateEmployeeInput): Promise<Employee> {
  return repo.createEmployee(pool, input);
}

export async function updateEmployee(pool: Pool, id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const emp = await repo.updateEmployee(pool, id, input);
  if (!emp) throw new AppError('NOT_FOUND', 'Employee not found', 404);
  return emp;
}

export async function deactivateEmployee(pool: Pool, id: string): Promise<Employee> {
  const emp = await repo.softDeleteEmployee(pool, id);
  if (!emp) throw new AppError('NOT_FOUND', 'Employee not found', 404);
  return emp;
}
```

- [ ] **Step 7: Create `backend/src/controllers/employeeController.ts`**

```typescript
import { Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../middleware/authenticate';
import { AppError } from '../types';
import {
  CreateEmployeeSchema, UpdateEmployeeSchema,
  listEmployees, getEmployee, createEmployee, updateEmployee, deactivateEmployee,
} from '../services/employeeService';

export function createEmployeeController(pool: Pool) {
  return {
    async list(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const page = parseInt(req.query.page as string || '1', 10);
        const limit = Math.min(parseInt(req.query.limit as string || '25', 10), 100);
        const filters = {
          country: req.query.country as string | undefined,
          job_title: req.query.job_title as string | undefined,
          is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
          search: req.query.search as string | undefined,
          page,
          limit,
        };
        const result = await listEmployees(pool, filters);
        res.json({ data: result });
      } catch (err) { next(err); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const emp = await getEmployee(pool, req.params.id);
        res.json({ data: emp });
      } catch (err) { next(err); }
    },

    async create(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const parsed = CreateEmployeeSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
        const emp = await createEmployee(pool, parsed.data);
        res.status(201).json({ data: emp });
      } catch (err) { next(err); }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const parsed = UpdateEmployeeSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
        const emp = await updateEmployee(pool, req.params.id, parsed.data);
        res.json({ data: emp });
      } catch (err) { next(err); }
    },

    async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const emp = await deactivateEmployee(pool, req.params.id);
        res.json({ data: emp });
      } catch (err) { next(err); }
    },
  };
}
```

- [ ] **Step 8: Create `backend/src/routes/employees.ts`**

```typescript
import { Router } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/authenticate';
import { createEmployeeController } from '../controllers/employeeController';

export function createEmployeeRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createEmployeeController(pool);

  router.use(authenticate);
  router.get('/', ctrl.list.bind(ctrl));
  router.get('/:id', ctrl.getOne.bind(ctrl));
  router.post('/', ctrl.create.bind(ctrl));
  router.patch('/:id', ctrl.update.bind(ctrl));
  router.delete('/:id', ctrl.deactivate.bind(ctrl));

  return router;
}
```

- [ ] **Step 9: Run all employee tests — verify they pass**

```bash
cd backend && npm test tests/unit/services/employeeService.test.ts tests/integration/routes/employees.test.ts
```

Expected: PASS — all tests passing.

- [ ] **Step 10: Commit**

```bash
git add backend/src/repositories/employeeRepository.ts backend/src/services/employeeService.ts backend/src/controllers/employeeController.ts backend/src/routes/employees.ts backend/tests/
git commit -m "feat(backend): employee CRUD routes with TDD"
```

---

## Task 6: Backend — Insights (TDD)

**Files:**
- Create: `backend/src/repositories/insightRepository.ts`
- Create: `backend/src/services/insightService.ts`
- Create: `backend/src/controllers/insightController.ts`
- Create: `backend/src/routes/insights.ts`
- Create: `backend/tests/unit/services/insightService.test.ts`
- Create: `backend/tests/integration/routes/insights.test.ts`

- [ ] **Step 1: Write failing unit tests for insightService**

Create `backend/tests/unit/services/insightService.test.ts`:

```typescript
import { normaliseSalaryStats } from '../../../src/services/insightService';

describe('normaliseSalaryStats', () => {
  it('rounds avg_salary to 2 decimal places', () => {
    const result = normaliseSalaryStats([
      { country: 'US', min_salary: '50000', max_salary: '150000', avg_salary: '99999.999', employee_count: '10' },
    ]);
    expect(result[0].avg_salary).toBe(100000);
    expect(result[0].min_salary).toBe(50000);
    expect(result[0].max_salary).toBe(150000);
    expect(result[0].employee_count).toBe(10);
  });

  it('handles empty array', () => {
    expect(normaliseSalaryStats([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run unit test — verify it fails**

```bash
cd backend && npm run test:unit tests/unit/services/insightService.test.ts
```

Expected: FAIL — `normaliseSalaryStats is not a function`.

- [ ] **Step 3: Write failing integration tests for insight routes**

Create `backend/tests/integration/routes/insights.test.ts`:

```typescript
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
```

- [ ] **Step 4: Run integration test — verify it fails**

```bash
cd backend && npm test tests/integration/routes/insights.test.ts
```

Expected: FAIL — `createInsightRouter is not a function`.

- [ ] **Step 5: Create `backend/src/repositories/insightRepository.ts`**

```typescript
import { Pool } from 'pg';
import { SalaryByCountry, SalaryByJobTitle, InsightSummary } from '../types';

export async function getSalaryByCountry(pool: Pool): Promise<Record<string, unknown>[]> {
  const result = await pool.query(`
    SELECT country,
           MIN(salary) AS min_salary,
           MAX(salary) AS max_salary,
           AVG(salary) AS avg_salary,
           COUNT(*)    AS employee_count
    FROM employees
    WHERE is_active = true
    GROUP BY country
    ORDER BY country
  `);
  return result.rows;
}

export async function getSalaryByJobTitle(pool: Pool, country: string): Promise<Record<string, unknown>[]> {
  const result = await pool.query(`
    SELECT job_title,
           AVG(salary) AS avg_salary,
           COUNT(*)    AS employee_count
    FROM employees
    WHERE country = $1 AND is_active = true
    GROUP BY job_title
    ORDER BY avg_salary DESC
  `, [country]);
  return result.rows;
}

export async function getInsightSummary(pool: Pool): Promise<InsightSummary> {
  const [totals, byCountry, byDept] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS total_employees,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_employees,
        SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS former_employees,
        AVG(CASE WHEN is_active THEN salary END) AS avg_salary
      FROM employees
    `),
    pool.query(`
      SELECT country, COUNT(*) AS count FROM employees WHERE is_active=true GROUP BY country ORDER BY count DESC LIMIT 10
    `),
    pool.query(`
      SELECT d.name AS department, COUNT(*) AS count
      FROM employees e LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.is_active=true GROUP BY d.name ORDER BY count DESC
    `),
  ]);

  const row = totals.rows[0];
  return {
    total_employees: parseInt(row.total_employees, 10),
    active_employees: parseInt(row.active_employees, 10),
    former_employees: parseInt(row.former_employees, 10),
    avg_salary: parseFloat(parseFloat(row.avg_salary || 0).toFixed(2)),
    headcount_by_country: byCountry.rows.map(r => ({ country: r.country, count: parseInt(r.count, 10) })),
    headcount_by_department: byDept.rows.map(r => ({ department: r.department, count: parseInt(r.count, 10) })),
  };
}
```

- [ ] **Step 6: Create `backend/src/services/insightService.ts`**

```typescript
import { Pool } from 'pg';
import { SalaryByCountry, SalaryByJobTitle, InsightSummary } from '../types';
import * as repo from '../repositories/insightRepository';

export function normaliseSalaryStats(rows: Record<string, unknown>[]): SalaryByCountry[] {
  return rows.map(r => ({
    country: r.country as string,
    min_salary: parseFloat(r.min_salary as string),
    max_salary: parseFloat(r.max_salary as string),
    avg_salary: parseFloat(parseFloat(r.avg_salary as string).toFixed(2)),
    employee_count: parseInt(r.employee_count as string, 10),
  }));
}

export function normaliseJobTitleStats(rows: Record<string, unknown>[]): SalaryByJobTitle[] {
  return rows.map(r => ({
    job_title: r.job_title as string,
    avg_salary: parseFloat(parseFloat(r.avg_salary as string).toFixed(2)),
    employee_count: parseInt(r.employee_count as string, 10),
  }));
}

export async function getSalaryByCountry(pool: Pool): Promise<SalaryByCountry[]> {
  const rows = await repo.getSalaryByCountry(pool);
  return normaliseSalaryStats(rows);
}

export async function getSalaryByJobTitle(pool: Pool, country: string): Promise<SalaryByJobTitle[]> {
  const rows = await repo.getSalaryByJobTitle(pool, country);
  return normaliseJobTitleStats(rows);
}

export async function getInsightSummary(pool: Pool): Promise<InsightSummary> {
  return repo.getInsightSummary(pool);
}
```

- [ ] **Step 7: Create `backend/src/controllers/insightController.ts`**

```typescript
import { Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../middleware/authenticate';
import { AppError } from '../types';
import { getSalaryByCountry, getSalaryByJobTitle, getInsightSummary } from '../services/insightService';

export function createInsightController(pool: Pool) {
  return {
    async summary(_req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const data = await getInsightSummary(pool);
        res.json({ data });
      } catch (err) { next(err); }
    },

    async salaryByCountry(_req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const data = await getSalaryByCountry(pool);
        res.json({ data });
      } catch (err) { next(err); }
    },

    async salaryByJobTitle(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const country = req.query.country as string;
        if (!country) throw new AppError('VALIDATION_ERROR', 'country query param is required', 400);
        const data = await getSalaryByJobTitle(pool, country);
        res.json({ data });
      } catch (err) { next(err); }
    },
  };
}
```

- [ ] **Step 8: Create `backend/src/routes/insights.ts`**

```typescript
import { Router } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/authenticate';
import { createInsightController } from '../controllers/insightController';

export function createInsightRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createInsightController(pool);

  router.use(authenticate);
  router.get('/summary', ctrl.summary.bind(ctrl));
  router.get('/salary-by-country', ctrl.salaryByCountry.bind(ctrl));
  router.get('/salary-by-jobtitle', ctrl.salaryByJobTitle.bind(ctrl));

  return router;
}
```

- [ ] **Step 9: Run all backend tests**

```bash
cd backend && npm test
```

Expected: PASS — all unit and integration tests passing.

- [ ] **Step 10: Commit**

```bash
git add backend/src/repositories/insightRepository.ts backend/src/services/insightService.ts backend/src/controllers/insightController.ts backend/src/routes/insights.ts backend/tests/
git commit -m "feat(backend): insight routes with TDD - summary, salary-by-country, salary-by-jobtitle"
```

---

## Task 7: Seed Script

**Files:**
- Create: `backend/seeds/data/departments.ts`
- Create: `backend/seeds/data/jobTitles.ts`
- Create: `backend/seeds/data/countries.ts`
- Create: `backend/seeds/data/salaryMatrix.ts`
- Create: `backend/seeds/seed.ts`
- Place: `backend/seeds/first_names.txt` (copy from assessment assets)
- Place: `backend/seeds/last_names.txt` (copy from assessment assets)

- [ ] **Step 1: Create `backend/seeds/data/departments.ts`**

```typescript
export const DEPARTMENTS = [
  'Engineering', 'Sales', 'HR', 'Finance',
  'Marketing', 'Operations', 'Legal', 'Product',
];
```

- [ ] **Step 2: Create `backend/seeds/data/jobTitles.ts`**

```typescript
export const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Data Analyst',
  'Product Manager', 'HR Manager', 'Sales Manager', 'Financial Analyst',
  'Marketing Manager', 'Operations Manager', 'Legal Counsel',
  'DevOps Engineer', 'UX Designer', 'Business Analyst', 'Recruiter',
  'Account Executive',
];
```

- [ ] **Step 3: Create `backend/seeds/data/countries.ts`**

```typescript
export const COUNTRIES: { code: string; weight: number }[] = [
  { code: 'US', weight: 35 },
  { code: 'UK', weight: 20 },
  { code: 'IN', weight: 20 },
  { code: 'DE', weight: 10 },
  { code: 'CA', weight: 7 },
  { code: 'AU', weight: 5 },
  { code: 'SG', weight: 3 },
];

export function pickWeightedCountry(rand: number): string {
  const total = COUNTRIES.reduce((s, c) => s + c.weight, 0);
  let cumulative = 0;
  for (const c of COUNTRIES) {
    cumulative += c.weight / total;
    if (rand < cumulative) return c.code;
  }
  return COUNTRIES[COUNTRIES.length - 1].code;
}
```

- [ ] **Step 4: Create `backend/seeds/data/salaryMatrix.ts`**

```typescript
type SalaryRange = [number, number];
type CountryMatrix = Record<string, SalaryRange>;

export const SALARY_MATRIX: Record<string, CountryMatrix> = {
  'Software Engineer':        { US:[90000,160000], UK:[55000,110000], IN:[8000,25000],  DE:[50000,95000],  CA:[75000,130000], AU:[70000,120000], SG:[60000,110000] },
  'Senior Software Engineer': { US:[130000,200000],UK:[75000,140000], IN:[15000,40000], DE:[70000,130000], CA:[100000,160000],AU:[90000,150000], SG:[80000,140000] },
  'Data Analyst':             { US:[55000,95000],  UK:[35000,65000],  IN:[4000,12000],  DE:[33000,60000],  CA:[50000,85000],  AU:[50000,80000],  SG:[45000,75000]  },
  'Product Manager':          { US:[100000,170000],UK:[65000,120000], IN:[10000,30000], DE:[60000,110000], CA:[85000,140000], AU:[80000,130000], SG:[70000,120000] },
  'HR Manager':               { US:[60000,100000], UK:[40000,75000],  IN:[5000,15000],  DE:[38000,70000],  CA:[55000,90000],  AU:[55000,85000],  SG:[50000,80000]  },
  'Sales Manager':            { US:[70000,130000], UK:[45000,90000],  IN:[6000,18000],  DE:[45000,85000],  CA:[60000,110000], AU:[60000,100000], SG:[55000,95000]  },
  'Financial Analyst':        { US:[60000,110000], UK:[40000,75000],  IN:[5000,14000],  DE:[40000,75000],  CA:[55000,95000],  AU:[55000,90000],  SG:[50000,85000]  },
  'Marketing Manager':        { US:[65000,115000], UK:[42000,80000],  IN:[5500,16000],  DE:[42000,78000],  CA:[58000,100000], AU:[58000,95000],  SG:[52000,88000]  },
  'Operations Manager':       { US:[65000,110000], UK:[42000,78000],  IN:[5000,15000],  DE:[40000,75000],  CA:[58000,95000],  AU:[55000,90000],  SG:[50000,85000]  },
  'Legal Counsel':            { US:[90000,160000], UK:[60000,110000], IN:[8000,22000],  DE:[55000,100000], CA:[80000,135000], AU:[75000,125000], SG:[70000,115000] },
  'DevOps Engineer':          { US:[95000,160000], UK:[55000,105000], IN:[8000,22000],  DE:[52000,95000],  CA:[80000,135000], AU:[72000,120000], SG:[65000,110000] },
  'UX Designer':              { US:[75000,130000], UK:[45000,85000],  IN:[6000,18000],  DE:[45000,82000],  CA:[65000,110000], AU:[62000,105000], SG:[58000,95000]  },
  'Business Analyst':         { US:[65000,110000], UK:[40000,78000],  IN:[5000,14000],  DE:[42000,78000],  CA:[58000,95000],  AU:[55000,90000],  SG:[52000,85000]  },
  'Recruiter':                { US:[50000,90000],  UK:[32000,60000],  IN:[4000,11000],  DE:[32000,58000],  CA:[45000,80000],  AU:[45000,75000],  SG:[40000,70000]  },
  'Account Executive':        { US:[55000,100000], UK:[35000,65000],  IN:[4500,13000],  DE:[35000,62000],  CA:[50000,88000],  AU:[48000,80000],  SG:[45000,75000]  },
};

const DEFAULT_RANGE: SalaryRange = [30000, 80000];

export function getSalaryForRole(jobTitle: string, country: string): number {
  const matrix = SALARY_MATRIX[jobTitle];
  const [min, max] = matrix?.[country] ?? DEFAULT_RANGE;
  return Math.round(min + Math.random() * (max - min));
}
```

- [ ] **Step 5: Create `backend/seeds/seed.ts`**

```typescript
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createPool } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { config } from '../src/config';
import { JOB_TITLES } from './data/jobTitles';
import { pickWeightedCountry } from './data/countries';
import { getSalaryForRole } from './data/salaryMatrix';

const TOTAL = 10_000;
const BATCH_SIZE = 1_000;

function readLines(filename: string): string[] {
  return fs.readFileSync(path.join(__dirname, filename), 'utf-8')
    .split('\n').map(l => l.trim()).filter(Boolean);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(yearsBack: number): string {
  const now = Date.now();
  const past = now - yearsBack * 365 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past)).toISOString().split('T')[0];
}

async function getDepartmentMap(pool: Pool): Promise<Record<string, number>> {
  const res = await pool.query('SELECT id, name FROM departments');
  return Object.fromEntries(res.rows.map((r: { name: string; id: number }) => [r.name, r.id]));
}

async function seed() {
  const pool = createPool(config.databaseUrl);
  await runMigrations(pool);

  const firstNames = readLines('first_names.txt');
  const lastNames = readLines('last_names.txt');
  const deptMap = await getDepartmentMap(pool);
  const deptNames = Object.keys(deptMap);
  const empTypes = ['full_time', 'full_time', 'full_time', 'part_time', 'contractor'] as const;

  console.time('seed');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const idx = batch * BATCH_SIZE + i;
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        const jobTitle = pick(JOB_TITLES);
        const country = pickWeightedCountry(Math.random());
        const salary = getSalaryForRole(jobTitle, country);
        const deptId = deptMap[pick(deptNames)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idx}@company.com`;
        const hireDate = randomDate(10);
        const isActive = Math.random() > 0.05;
        const terminationDate = isActive ? null : randomDate(2);
        const empType = pick(empTypes);
        const base = i * 11;
        placeholders.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11})`);
        values.push(firstName, lastName, email, jobTitle, deptId, country, salary, empType, hireDate, isActive, terminationDate);
      }
      await client.query(
        `INSERT INTO employees (first_name,last_name,email,job_title,department_id,country,salary,employment_type,hire_date,is_active,termination_date)
         VALUES ${placeholders.join(',')} ON CONFLICT (email) DO NOTHING`,
        values
      );
      console.log(`Batch ${batch + 1}/${TOTAL / BATCH_SIZE} done`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.timeEnd('seed');
  const { rows } = await pool.query('SELECT COUNT(*) FROM employees');
  console.log(`Total employees: ${rows[0].count}`);
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 6: Copy `first_names.txt` and `last_names.txt` into `backend/seeds/`**

One name per line in each file.

- [ ] **Step 7: Run the seed**

```bash
cd backend && npm run seed
```

Expected: 10 batch logs, `seed: <5000ms`, `Total employees: 10000`.

- [ ] **Step 8: Commit**

```bash
git add backend/seeds/
git commit -m "feat(backend): seed script — 10k employees, batch inserts, country×job salary matrix"
```

---

## Task 8: Frontend — Project Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/test-setup.ts`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/formatCurrency.ts`
- Create: `frontend/src/lib/constants.ts`
- Create: `frontend/src/store/authStore.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/router/index.tsx`
- Create: `frontend/src/components/PageLayout.tsx`
- Create: `frontend/src/components/StatCard.tsx`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "salary-management-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "@hookform/resolvers": "^3.3.4",
    "@mui/icons-material": "^5.15.6",
    "@mui/material": "^5.15.6",
    "@mui/x-charts": "^6.19.1",
    "@mui/x-data-grid": "^6.19.4",
    "@tanstack/react-query": "^5.17.19",
    "@tanstack/react-router": "^1.14.1",
    "axios": "^1.6.7",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.2.1",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "axios-mock-adapter": "^1.22.0",
    "jsdom": "^23.0.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "vitest": "^1.2.1"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
});
```

- [ ] **Step 4: Create `frontend/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
});
```

- [ ] **Step 5: Create `frontend/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Salary Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `frontend/src/types/index.ts`**

```typescript
export type EmploymentType = 'full_time' | 'part_time' | 'contractor';

export interface User { id: string; email: string; full_name: string }

export interface Employee {
  id: string; first_name: string; last_name: string; full_name: string;
  email: string; job_title: string; department_id: number; country: string;
  salary: number; employment_type: EmploymentType; hire_date: string;
  is_active: boolean; termination_date: string | null;
  created_at: string; updated_at: string;
}

export interface CreateEmployeeInput {
  first_name: string; last_name: string; email: string; job_title: string;
  department_id: number; country: string; salary: number;
  employment_type: EmploymentType; hire_date: string;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface EmployeeFilters {
  country?: string; job_title?: string; is_active?: boolean;
  search?: string; page?: number; limit?: number;
}

export interface PaginatedEmployees {
  employees: Employee[]; total: number; page: number; limit: number; totalPages: number;
}

export interface SalaryByCountry {
  country: string; min_salary: number; max_salary: number;
  avg_salary: number; employee_count: number;
}

export interface SalaryByJobTitle { job_title: string; avg_salary: number; employee_count: number }

export interface InsightSummary {
  total_employees: number; active_employees: number; former_employees: number; avg_salary: number;
  headcount_by_country: Array<{ country: string; count: number }>;
  headcount_by_department: Array<{ department: string; count: number }>;
}

export interface ApiResponse<T> { data: T }
```

- [ ] **Step 8: Create `frontend/src/lib/formatCurrency.ts`**

```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(value);
}
```

- [ ] **Step 9: Create `frontend/src/lib/constants.ts`**

```typescript
export const COUNTRIES = ['US', 'UK', 'IN', 'DE', 'CA', 'AU', 'SG'] as const;
export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contractor', label: 'Contractor' },
] as const;
export const DEFAULT_PAGE_SIZE = 25;
```

- [ ] **Step 10: Create `frontend/src/store/authStore.ts`**

```typescript
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
```

- [ ] **Step 11: Create `frontend/src/api/client.ts`**

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({ baseURL: '/api/v1', withCredentials: true });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const { accessToken } = res.data.data;
        useAuthStore.getState().setAuth(accessToken, useAuthStore.getState().user!);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 12: Create `frontend/src/router/index.tsx`**

```typescript
import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useAuthStore } from '../store/authStore';

const Login = lazy(() => import('../pages/Login'));
const Employees = lazy(() => import('../pages/Employees'));
const Insights = lazy(() => import('../pages/Insights'));

const Spinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const rootRoute = createRootRoute();
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login',
  component: () => <Suspense fallback={<Spinner />}><Login /></Suspense> });
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute, id: '_authenticated',
  beforeLoad: () => { if (!useAuthStore.getState().accessToken) throw redirect({ to: '/login' }); },
});
const employeesRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/employees',
  component: () => <Suspense fallback={<Spinner />}><Employees /></Suspense> });
const insightsRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/insights',
  component: () => <Suspense fallback={<Spinner />}><Insights /></Suspense> });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/',
  beforeLoad: () => { throw redirect({ to: '/employees' }); } });

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute, loginRoute,
    authenticatedRoute.addChildren([employeesRoute, insightsRoute]),
  ]),
});

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
```

- [ ] **Step 13: Create `frontend/src/components/PageLayout.tsx`**

```typescript
import { Box, AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

export function PageLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await apiClient.post('/auth/logout').catch(() => {});
    clearAuth();
    navigate({ to: '/login' });
  };

  const tab = pathname.startsWith('/insights') ? '/insights' : '/employees';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Salary Management</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{user?.full_name}</Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
        <Tabs value={tab} textColor="inherit" indicatorColor="secondary">
          <Tab label="Employees" value="/employees" onClick={() => navigate({ to: '/employees' })} />
          <Tab label="Insights" value="/insights" onClick={() => navigate({ to: '/insights' })} />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>{children}</Box>
    </Box>
  );
}
```

- [ ] **Step 14: Create `frontend/src/components/StatCard.tsx`**

```typescript
import { Card, CardContent, Typography } from '@mui/material';

interface Props { title: string; value: string | number; subtitle?: string }

export function StatCard({ title, value, subtitle }: Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 15: Create `frontend/src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 16: Install and verify**

```bash
cd frontend && npm install && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 17: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): project scaffolding, router, auth store, shared components"
```

---

## Task 9: Frontend — Auth (TDD)

**Files:**
- Create: `frontend/src/services/auth.ts`
- Create: `frontend/src/features/auth/useAuth.ts`
- Create: `frontend/src/features/auth/LoginForm.tsx`
- Create: `frontend/src/features/auth/LoginForm.test.tsx`
- Create: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/features/auth/LoginForm.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email, password fields and sign in button', () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'bad-email');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'hr@company.com');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls onSuccess on valid credentials', async () => {
    const onSuccess = vi.fn();
    const loginFn = vi.fn().mockResolvedValue({
      accessToken: 'tok', user: { id: '1', email: 'hr@company.com', full_name: 'HR' },
    });
    render(<LoginForm onSuccess={onSuccess} loginFn={loginFn} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'hr@company.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('tok', expect.objectContaining({ email: 'hr@company.com' })));
  });

  it('shows server error message on failed login', async () => {
    const loginFn = vi.fn().mockRejectedValue({ response: { data: { error: { message: 'Invalid credentials' } } } });
    render(<LoginForm onSuccess={vi.fn()} loginFn={loginFn} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'hr@company.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd frontend && npm test src/features/auth/LoginForm.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/services/auth.ts`**

```typescript
import { apiClient } from '../api/client';
import { ApiResponse, User } from '../types';

export async function loginApi(email: string, password: string): Promise<{ accessToken: string; user: User }> {
  const res = await apiClient.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', { email, password });
  return res.data.data;
}
```

- [ ] **Step 4: Create `frontend/src/features/auth/LoginForm.tsx`**

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Box, Alert, CircularProgress } from '@mui/material';
import { User } from '../../types';
import { loginApi } from '../../services/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess: (accessToken: string, user: User) => void;
  loginFn?: (email: string, password: string) => Promise<{ accessToken: string; user: User }>;
}

export function LoginForm({ onSuccess, loginFn = loginApi }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null);
    try {
      const { accessToken, user } = await loginFn(email, password);
      onSuccess(accessToken, user);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Login failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <TextField label="Email" type="email" inputProps={{ 'aria-label': 'Email' }}
        {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
      <TextField label="Password" type="password" inputProps={{ 'aria-label': 'Password' }}
        {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
      </Button>
    </Box>
  );
}
```

- [ ] **Step 5: Run — verify it passes**

```bash
cd frontend && npm test src/features/auth/LoginForm.test.tsx
```

Expected: PASS — 5 tests.

- [ ] **Step 6: Create `frontend/src/features/auth/useAuth.ts`**

```typescript
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';

export function useAuth() {
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, accessToken } = useAuthStore();

  const handleLoginSuccess = (token: string, user: User) => {
    setAuth(token, user);
    navigate({ to: '/employees' });
  };

  return { handleLoginSuccess, clearAuth, user, isAuthenticated: !!accessToken };
}
```

- [ ] **Step 7: Create `frontend/src/pages/Login.tsx`**

```typescript
import { Box, Paper, Typography } from '@mui/material';
import { LoginForm } from '../features/auth/LoginForm';
import { useAuth } from '../features/auth/useAuth';

export default function Login() {
  const { handleLoginSuccess } = useAuth();
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="grey.100">
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">HR Portal</Typography>
        <LoginForm onSuccess={handleLoginSuccess} />
      </Paper>
    </Box>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/services/auth.ts frontend/src/features/auth/ frontend/src/pages/Login.tsx
git commit -m "feat(frontend): login page with TDD"
```

---

## Task 10: Frontend — Employees (TDD)

**Files:**
- Create: `frontend/src/services/employees.ts`
- Create: `frontend/src/features/employees/hooks/useEmployees.ts`
- Create: `frontend/src/features/employees/EmployeeTable.tsx`
- Create: `frontend/src/features/employees/EmployeeTable.test.tsx`
- Create: `frontend/src/features/employees/EmployeeModal.tsx`
- Create: `frontend/src/features/employees/EmployeeModal.test.tsx`
- Create: `frontend/src/pages/Employees.tsx`

- [ ] **Step 1: Write failing test for EmployeeTable**

Create `frontend/src/features/employees/EmployeeTable.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EmployeeTable } from './EmployeeTable';
import { Employee } from '../../types';

const emp: Employee = {
  id: '1', first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe',
  email: 'jane@co.com', job_title: 'Software Engineer', department_id: 1,
  country: 'US', salary: 120000, employment_type: 'full_time',
  hire_date: '2022-01-01', is_active: true, termination_date: null,
  created_at: '2022-01-01T00:00:00Z', updated_at: '2022-01-01T00:00:00Z',
};

describe('EmployeeTable', () => {
  it('renders employee name, job title, and formatted salary', () => {
    render(<EmployeeTable employees={[emp]} total={1} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={vi.fn()} onDeactivate={vi.fn()} loading={false} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
  });

  it('shows loading indicator when loading=true', () => {
    render(<EmployeeTable employees={[]} total={0} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={vi.fn()} onDeactivate={vi.fn()} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onEdit when Edit clicked', async () => {
    const onEdit = vi.fn();
    render(<EmployeeTable employees={[emp]} total={1} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={onEdit} onDeactivate={vi.fn()} loading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(emp);
  });

  it('calls onDeactivate when Deactivate clicked', async () => {
    const onDeactivate = vi.fn();
    render(<EmployeeTable employees={[emp]} total={1} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={vi.fn()} onDeactivate={onDeactivate} loading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    expect(onDeactivate).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd frontend && npm test src/features/employees/EmployeeTable.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/services/employees.ts`**

```typescript
import { apiClient } from '../api/client';
import { ApiResponse, Employee, CreateEmployeeInput, UpdateEmployeeInput, PaginatedEmployees, EmployeeFilters } from '../types';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (f: EmployeeFilters) => [...employeeKeys.all, 'list', f] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
};

export const fetchEmployees = (f: EmployeeFilters) =>
  apiClient.get<ApiResponse<PaginatedEmployees>>('/employees', { params: f }).then(r => r.data.data);

export const createEmployee = (input: CreateEmployeeInput) =>
  apiClient.post<ApiResponse<Employee>>('/employees', input).then(r => r.data.data);

export const updateEmployee = (id: string, input: UpdateEmployeeInput) =>
  apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, input).then(r => r.data.data);

export const deactivateEmployee = (id: string) =>
  apiClient.delete<ApiResponse<Employee>>(`/employees/${id}`).then(r => r.data.data);

export const fetchDepartments = () =>
  apiClient.get<ApiResponse<Array<{ id: number; name: string }>>>('/employees/departments').then(r => r.data.data);
```

- [ ] **Step 4: Create `frontend/src/features/employees/hooks/useEmployees.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeFilters, CreateEmployeeInput, UpdateEmployeeInput } from '../../../types';
import { fetchEmployees, createEmployee, updateEmployee, deactivateEmployee, fetchDepartments, employeeKeys } from '../../../services/employees';

export const useEmployees = (f: EmployeeFilters) =>
  useQuery({ queryKey: employeeKeys.list(f), queryFn: () => fetchEmployees(f) });

export const useDepartments = () =>
  useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createEmployee, onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }) });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) => updateEmployee(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deactivateEmployee, onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }) });
}
```

- [ ] **Step 5: Create `frontend/src/features/employees/EmployeeTable.tsx`**

```typescript
import { Box, Button, Chip, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Employee } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';

interface Props {
  employees: Employee[]; total: number; page: number; pageSize: number; loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (emp: Employee) => void;
  onDeactivate: (id: string) => void;
}

export function EmployeeTable({ employees, total, page, pageSize, loading, onPageChange, onEdit, onDeactivate }: Props) {
  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const columns: GridColDef<Employee>[] = [
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'job_title', headerName: 'Job Title', flex: 1, minWidth: 150 },
    { field: 'country', headerName: 'Country', width: 90 },
    { field: 'salary', headerName: 'Salary', width: 120, valueFormatter: (v) => formatCurrency(v as number) },
    { field: 'employment_type', headerName: 'Type', width: 120, valueFormatter: (v) => (v as string).replace('_', ' ') },
    { field: 'is_active', headerName: 'Status', width: 100,
      renderCell: ({ value }) => <Chip label={value ? 'Active' : 'Inactive'} color={value ? 'success' : 'default'} size="small" /> },
    { field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" aria-label="Edit" onClick={() => onEdit(row)}>Edit</Button>
          {row.is_active && (
            <Button size="small" variant="outlined" color="error" aria-label="Deactivate" onClick={() => onDeactivate(row.id)}>Deactivate</Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <DataGrid rows={employees} columns={columns} rowCount={total}
      pageSizeOptions={[10, 25, 50]}
      paginationModel={{ page: page - 1, pageSize }}
      paginationMode="server"
      onPaginationModelChange={({ page: p, pageSize: ps }) => onPageChange(p + 1, ps)}
      disableRowSelectionOnClick autoHeight />
  );
}
```

- [ ] **Step 6: Run EmployeeTable test — verify passes**

```bash
cd frontend && npm test src/features/employees/EmployeeTable.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Write failing test for EmployeeModal**

Create `frontend/src/features/employees/EmployeeModal.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EmployeeModal } from './EmployeeModal';

const departments = [{ id: 1, name: 'Engineering' }];

describe('EmployeeModal', () => {
  it('renders all required form fields', () => {
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salary/i)).toBeInTheDocument();
  });

  it('shows validation error when first name is empty', async () => {
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/first name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Wong');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@co.com');
    await userEvent.type(screen.getByLabelText(/job title/i), 'Engineer');
    await userEvent.type(screen.getByLabelText(/salary/i), '100000');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('calls onClose when Cancel clicked', async () => {
    const onClose = vi.fn();
    render(<EmployeeModal open mode="create" departments={departments} onClose={onClose} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 8: Run — verify it fails**

```bash
cd frontend && npm test src/features/employees/EmployeeModal.test.tsx
```

Expected: FAIL.

- [ ] **Step 9: Create `frontend/src/features/employees/EmployeeModal.tsx`**

```typescript
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material';
import { Employee, CreateEmployeeInput } from '../../types';
import { COUNTRIES, EMPLOYMENT_TYPES } from '../../lib/constants';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  job_title: z.string().min(1, 'Job title is required'),
  department_id: z.number({ invalid_type_error: 'Select a department' }).int().positive(),
  country: z.string().min(1),
  salary: z.number({ invalid_type_error: 'Enter a salary' }).positive(),
  employment_type: z.enum(['full_time', 'part_time', 'contractor']),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean; mode: 'create' | 'edit'; employee?: Employee;
  departments: Array<{ id: number; name: string }>;
  onClose: () => void; onSubmit: (v: CreateEmployeeInput) => Promise<void>;
}

export function EmployeeModal({ open, mode, employee, departments, onClose, onSubmit }: Props) {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employment_type: 'full_time', country: 'US' },
  });

  useEffect(() => {
    if (employee) reset({ ...employee });
    else reset({ employment_type: 'full_time', country: 'US' });
  }, [employee, reset, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Add Employee' : 'Edit Employee'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <TextField fullWidth label="First Name" inputProps={{ 'aria-label': 'First Name' }}
              {...register('first_name')} error={!!errors.first_name} helperText={errors.first_name?.message} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Last Name" inputProps={{ 'aria-label': 'Last Name' }}
              {...register('last_name')} error={!!errors.last_name} helperText={errors.last_name?.message} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Email" inputProps={{ 'aria-label': 'Email' }}
              {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Job Title" inputProps={{ 'aria-label': 'Job Title' }}
              {...register('job_title')} error={!!errors.job_title} helperText={errors.job_title?.message} />
          </Grid>
          <Grid item xs={6}>
            <Controller name="department_id" control={control} render={({ field }) => (
              <TextField select fullWidth label="Department" inputProps={{ 'aria-label': 'Department' }}
                value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))}
                error={!!errors.department_id} helperText={errors.department_id?.message}>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            )} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Country" inputProps={{ 'aria-label': 'Country' }}
              {...register('country')} error={!!errors.country} helperText={errors.country?.message}>
              {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Salary" type="number" inputProps={{ 'aria-label': 'Salary' }}
              {...register('salary', { valueAsNumber: true })} error={!!errors.salary} helperText={errors.salary?.message} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Employment Type" inputProps={{ 'aria-label': 'Employment Type' }}
              {...register('employment_type')} error={!!errors.employment_type} helperText={errors.employment_type?.message}>
              {EMPLOYMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Hire Date" type="date" InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'Hire Date' }}
              {...register('hire_date')} error={!!errors.hire_date} helperText={errors.hire_date?.message} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} aria-label="Save">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 10: Run EmployeeModal test — verify passes**

```bash
cd frontend && npm test src/features/employees/EmployeeModal.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Create `frontend/src/pages/Employees.tsx`**

```typescript
import { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Stack } from '@mui/material';
import { PageLayout } from '../components/PageLayout';
import { EmployeeTable } from '../features/employees/EmployeeTable';
import { EmployeeModal } from '../features/employees/EmployeeModal';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeactivateEmployee, useDepartments } from '../features/employees/hooks/useEmployees';
import { Employee, CreateEmployeeInput, EmployeeFilters } from '../types';
import { COUNTRIES, DEFAULT_PAGE_SIZE } from '../lib/constants';

export default function Employees() {
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, limit: DEFAULT_PAGE_SIZE, is_active: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();

  const { data, isLoading } = useEmployees(filters);
  const { data: departments = [] } = useDepartments();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deactivateMutation = useDeactivateEmployee();

  const handleSubmit = async (values: CreateEmployeeInput) => {
    if (editEmployee) await updateMutation.mutateAsync({ id: editEmployee.id, input: values });
    else await createMutation.mutateAsync(values);
    setModalOpen(false);
    setEditEmployee(undefined);
  };

  return (
    <PageLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Employees</Typography>
        <Button variant="contained" onClick={() => { setEditEmployee(undefined); setModalOpen(true); }}>Add Employee</Button>
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField size="small" label="Search" value={filters.search ?? ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined, page: 1 }))} />
        <TextField select size="small" label="Country" value={filters.country ?? ''} sx={{ minWidth: 100 }}
          onChange={e => setFilters(f => ({ ...f, country: e.target.value || undefined, page: 1 }))}>
          <MenuItem value="">All</MenuItem>
          {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={filters.is_active === undefined ? '' : String(filters.is_active)} sx={{ minWidth: 110 }}
          onChange={e => setFilters(f => ({ ...f, is_active: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 }))}>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Former</MenuItem>
          <MenuItem value="">All</MenuItem>
        </TextField>
      </Stack>
      <EmployeeTable employees={data?.employees ?? []} total={data?.total ?? 0}
        page={filters.page ?? 1} pageSize={filters.limit ?? DEFAULT_PAGE_SIZE}
        loading={isLoading}
        onPageChange={(page, pageSize) => setFilters(f => ({ ...f, page, limit: pageSize }))}
        onEdit={emp => { setEditEmployee(emp); setModalOpen(true); }}
        onDeactivate={id => deactivateMutation.mutate(id)} />
      <EmployeeModal open={modalOpen} mode={editEmployee ? 'edit' : 'create'} employee={editEmployee}
        departments={departments} onClose={() => { setModalOpen(false); setEditEmployee(undefined); }}
        onSubmit={handleSubmit} />
    </PageLayout>
  );
}
```

- [ ] **Step 12: Add departments route to backend (before `/:id`)**

In `backend/src/routes/employees.ts`, inside `createEmployeeRouter`, add before `router.get('/:id', ...)`:

```typescript
router.get('/departments', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name FROM departments ORDER BY name');
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});
```

- [ ] **Step 13: Commit**

```bash
git add frontend/src/services/employees.ts frontend/src/features/employees/ frontend/src/pages/Employees.tsx backend/src/routes/employees.ts
git commit -m "feat: employee CRUD page with table and modal — TDD"
```

---

## Task 11: Frontend — Insights (TDD)

**Files:**
- Create: `frontend/src/services/insights.ts`
- Create: `frontend/src/features/insights/hooks/useInsights.ts`
- Create: `frontend/src/features/insights/SummaryCards.tsx`
- Create: `frontend/src/features/insights/SummaryCards.test.tsx`
- Create: `frontend/src/features/insights/SalaryByCountryChart.tsx`
- Create: `frontend/src/features/insights/SalaryByJobTitleChart.tsx`
- Create: `frontend/src/features/insights/HeadcountChart.tsx`
- Create: `frontend/src/pages/Insights.tsx`

- [ ] **Step 1: Write failing test for SummaryCards**

Create `frontend/src/features/insights/SummaryCards.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { SummaryCards } from './SummaryCards';
import { InsightSummary } from '../../types';

const summary: InsightSummary = {
  total_employees: 10000, active_employees: 9500, former_employees: 500, avg_salary: 75000,
  headcount_by_country: [], headcount_by_department: [],
};

describe('SummaryCards', () => {
  it('renders total employees', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });
  it('renders active employees', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('9,500')).toBeInTheDocument();
  });
  it('renders avg salary as USD currency', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('$75,000')).toBeInTheDocument();
  });
  it('renders former employees', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd frontend && npm test src/features/insights/SummaryCards.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/services/insights.ts`**

```typescript
import { apiClient } from '../api/client';
import { ApiResponse, SalaryByCountry, SalaryByJobTitle, InsightSummary } from '../types';

export const insightKeys = {
  summary: ['insights', 'summary'] as const,
  salaryByCountry: ['insights', 'salary-by-country'] as const,
  salaryByJobTitle: (country: string) => ['insights', 'salary-by-jobtitle', country] as const,
};

export const fetchSummary = () =>
  apiClient.get<ApiResponse<InsightSummary>>('/insights/summary').then(r => r.data.data);

export const fetchSalaryByCountry = () =>
  apiClient.get<ApiResponse<SalaryByCountry[]>>('/insights/salary-by-country').then(r => r.data.data);

export const fetchSalaryByJobTitle = (country: string) =>
  apiClient.get<ApiResponse<SalaryByJobTitle[]>>('/insights/salary-by-jobtitle', { params: { country } }).then(r => r.data.data);
```

- [ ] **Step 4: Create `frontend/src/features/insights/hooks/useInsights.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchSalaryByCountry, fetchSalaryByJobTitle, insightKeys } from '../../../services/insights';

export const useSummary = () => useQuery({ queryKey: insightKeys.summary, queryFn: fetchSummary });
export const useSalaryByCountry = () => useQuery({ queryKey: insightKeys.salaryByCountry, queryFn: fetchSalaryByCountry });
export const useSalaryByJobTitle = (country: string) =>
  useQuery({ queryKey: insightKeys.salaryByJobTitle(country), queryFn: () => fetchSalaryByJobTitle(country), enabled: !!country });
```

- [ ] **Step 5: Create `frontend/src/features/insights/SummaryCards.tsx`**

```typescript
import { Grid } from '@mui/material';
import { StatCard } from '../../components/StatCard';
import { InsightSummary } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';

export function SummaryCards({ summary }: { summary: InsightSummary }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Total Employees" value={summary.total_employees.toLocaleString()} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Active Employees" value={summary.active_employees.toLocaleString()} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Former Employees" value={summary.former_employees.toLocaleString()} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Avg Salary (Active)" value={formatCurrency(summary.avg_salary)} subtitle="USD" />
      </Grid>
    </Grid>
  );
}
```

- [ ] **Step 6: Run SummaryCards test — verify passes**

```bash
cd frontend && npm test src/features/insights/SummaryCards.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Create `frontend/src/features/insights/SalaryByCountryChart.tsx`**

```typescript
import { Paper, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { SalaryByCountry } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';

export function SalaryByCountryChart({ data }: { data: SalaryByCountry[] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>Salary by Country (USD)</Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <BarChart
          xAxis={[{ data: data.map(d => d.country), scaleType: 'band' }]}
          series={[
            { data: data.map(d => d.min_salary), label: 'Min', valueFormatter: (v) => formatCurrency(v ?? 0) },
            { data: data.map(d => d.avg_salary), label: 'Avg', valueFormatter: (v) => formatCurrency(v ?? 0) },
            { data: data.map(d => d.max_salary), label: 'Max', valueFormatter: (v) => formatCurrency(v ?? 0) },
          ]}
          height={320}
        />
      </Box>
    </Paper>
  );
}
```

- [ ] **Step 8: Create `frontend/src/features/insights/SalaryByJobTitleChart.tsx`**

```typescript
import { useState } from 'react';
import { Paper, Typography, TextField, MenuItem, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useSalaryByJobTitle } from './hooks/useInsights';
import { COUNTRIES } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatCurrency';

export function SalaryByJobTitleChart() {
  const [country, setCountry] = useState('US');
  const { data = [] } = useSalaryByJobTitle(country);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Avg Salary by Job Title</Typography>
        <TextField select size="small" value={country} onChange={e => setCountry(e.target.value)} sx={{ minWidth: 100 }}>
          {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>
      <BarChart
        layout="horizontal"
        yAxis={[{ data: data.map(d => d.job_title), scaleType: 'band' }]}
        series={[{ data: data.map(d => d.avg_salary), label: 'Avg Salary', valueFormatter: (v) => formatCurrency(v ?? 0) }]}
        height={Math.max(300, data.length * 40)}
      />
    </Paper>
  );
}
```

- [ ] **Step 9: Create `frontend/src/features/insights/HeadcountChart.tsx`**

```typescript
import { Paper, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { InsightSummary } from '../../types';

export function HeadcountChart({ summary }: { summary: InsightSummary }) {
  const data = summary.headcount_by_department.map((d, i) => ({ id: i, value: d.count, label: d.department }));
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>Headcount by Department</Typography>
      <PieChart series={[{ data, innerRadius: 60 }]} height={280} />
    </Paper>
  );
}
```

- [ ] **Step 10: Create `frontend/src/pages/Insights.tsx`**

```typescript
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { PageLayout } from '../components/PageLayout';
import { SummaryCards } from '../features/insights/SummaryCards';
import { SalaryByCountryChart } from '../features/insights/SalaryByCountryChart';
import { SalaryByJobTitleChart } from '../features/insights/SalaryByJobTitleChart';
import { HeadcountChart } from '../features/insights/HeadcountChart';
import { useSummary, useSalaryByCountry } from '../features/insights/hooks/useInsights';

export default function Insights() {
  const { data: summary, isLoading, error } = useSummary();
  const { data: salaryByCountry = [] } = useSalaryByCountry();

  if (isLoading) return <PageLayout><Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box></PageLayout>;
  if (error) return <PageLayout><Alert severity="error">Failed to load insights.</Alert></PageLayout>;

  return (
    <PageLayout>
      <Typography variant="h5" mb={3}>Salary Insights</Typography>
      <SummaryCards summary={summary!} />
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12}><SalaryByCountryChart data={salaryByCountry} /></Grid>
        <Grid item xs={12} md={7}><SalaryByJobTitleChart /></Grid>
        <Grid item xs={12} md={5}><HeadcountChart summary={summary!} /></Grid>
      </Grid>
    </PageLayout>
  );
}
```

- [ ] **Step 11: Run all frontend tests**

```bash
cd frontend && npm test
```

Expected: PASS — all tests green.

- [ ] **Step 12: Commit**

```bash
git add frontend/src/services/insights.ts frontend/src/features/insights/ frontend/src/pages/Insights.tsx
git commit -m "feat(frontend): insights page — summary cards, salary charts, headcount chart — TDD"
```

---

## Task 12: Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

- [ ] **Step 1: Create `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY src/db/migrations ./dist/src/db/migrations
EXPOSE 3001
CMD ["node", "dist/src/index.js"]
```

- [ ] **Step 2: Create `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 3: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: salary_management
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: { context: ./backend, dockerfile: Dockerfile }
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/salary_management
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: http://localhost:3000
      NODE_ENV: production
    depends_on:
      postgres: { condition: service_healthy }

  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile }
    ports:
      - '3000:80'
    depends_on:
      - backend

volumes:
  postgres_data:
```

- [ ] **Step 5: Create root `.env.example`**

```env
JWT_SECRET=replace-with-min-32-char-secret-here
JWT_REFRESH_SECRET=replace-with-min-32-char-refresh-secret
```

- [ ] **Step 6: Start the stack**

```bash
cp .env.example .env
# Edit .env with real secrets, then:
docker-compose up --build
```

Expected: All 3 services start. Visit `http://localhost:3001/health` → `{"status":"ok"}`. Visit `http://localhost:3000` → login page loads.

- [ ] **Step 7: Seed the database via Docker**

```bash
docker-compose exec backend node dist/seeds/seed.js
```

Expected: `Total employees: 10000`.

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml .env.example backend/Dockerfile frontend/Dockerfile frontend/nginx.conf
git commit -m "feat: docker compose for local deployment — postgres + backend + frontend"
```

---

## Self-Review

- [x] **Spec coverage:** Auth login/refresh/logout ✓ · Employee CRUD + soft delete ✓ · Insights summary/by-country/by-jobtitle ✓ · Seed 10k batch ✓ · TDD red→green throughout ✓ · `is_active` boolean + `termination_date` ✓ · Country×job salary matrix ✓ · JWT httpOnly cookie ✓ · MUI DataGrid ✓ · MUI Charts (bar, pie) ✓ · Docker Compose ✓ · Departments endpoint ✓
- [x] **No placeholders:** All steps have real TypeScript/SQL code.
- [x] **Type consistency:** `Employee`, `CreateEmployeeInput`, `InsightSummary`, `SalaryByCountry`, `SalaryByJobTitle` defined once in `src/types/index.ts` (BE Task 1) and `src/types/index.ts` (FE Task 8), referenced consistently in all later tasks.
- [x] **Method names:** `createAuthRouter` / `createEmployeeRouter` / `createInsightRouter` defined Tasks 4–6, imported in `app.ts` Task 3. `buildEmployeeFiltersQuery` defined and unit-tested Task 5. `normaliseSalaryStats` / `normaliseJobTitleStats` defined and unit-tested Task 6. `employeeKeys` / `insightKeys` defined in services and used in hooks.
- [x] **Departments route ordering:** Added before `/:id` in Task 10 Step 12 to avoid route collision.
