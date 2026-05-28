# Salary Management Tool — Design Spec

**Date:** 2026-05-26
**Author:** Sarvesh
**Status:** Approved

---

## 1. Goal

Build a minimal, fully functional salary management tool for an organisation with 10,000 employees. The primary user is an **HR Manager** who needs to manage employee records and derive salary insights across countries and job titles.

---

## 2. User Persona

**HR Manager** — needs to:

- Add, view, update, and deactivate employee records via a clean UI
- Login securely (only authorised HR staff can access the tool)
- View salary analytics broken down by country and job title
- Distinguish between active and former employees

---

## 3. Architecture

**Option A — Monorepo, separate frontend and backend.**

```
salary-management/
├── backend/          → Express REST API (Node.js + TypeScript)
├── frontend/         → React SPA (Vite + TypeScript)
├── docs/             → Design specs, architecture notes
└── README.md
```

- Backend runs on port **3001** (pure REST API)
- Frontend dev server runs on port **3000**, proxies `/api` calls to backend
- No SSR — this is an authenticated internal tool; SSR adds complexity with no benefit
- Deployment: local for now (Docker Compose for running Postgres + backend + frontend together)

---

## 4. Tech Stack

### Backend

| Concern          | Choice                | Reason                                                 |
| ---------------- | --------------------- | ------------------------------------------------------ |
| Runtime          | Node.js + TypeScript  | Type safety, large ecosystem                           |
| Framework        | Express               | Proven, simple, well-understood                        |
| Database         | PostgreSQL            | Reliable, feature-rich, handles aggregations well      |
| DB client        | `pg` (node-postgres)  | Raw SQL — transparent, fast, no ORM overhead           |
| Auth             | JWT + httpOnly cookie | Access token in memory, refresh token in secure cookie |
| Password hashing | `bcryptjs` (cost 12)  | Industry standard                                      |
| Validation       | Zod                   | Type-safe, composable schemas at API boundary          |
| Logging          | Pino                  | Fastest structured logger for Node.js                  |
| Security headers | Helmet.js             | Sets secure HTTP headers out of the box                |
| Testing          | Jest + Supertest      | Unit + integration tests against real test DB          |

### Frontend

| Concern           | Choice                                                | Reason                                            |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Framework         | React 18 + Vite + TypeScript                          | Fast HMR, simple SPA, no SSR overhead             |
| Component library | MUI (`@mui/material`)                                 | Polished, enterprise-ready, consistent design     |
| Data grid         | `@mui/x-data-grid`                                    | Built-in sort, filter, pagination, virtualization |
| Charts            | `@mui/x-charts`                                       | Same design system as MUI, no extra bundle cost   |
| Routing           | TanStack Router                                       | Type-safe, auth guard at router level             |
| Server state      | TanStack Query                                        | Caching, revalidation, loading/error states       |
| Global UI state   | Zustand                                               | Auth token stored in memory (never localStorage)  |
| Forms             | React Hook Form + Zod + `@hookform/resolvers`         | Login form + employee add/edit modal              |
| HTTP client       | Axios                                                 | Interceptors for token attachment + auto-refresh  |
| Testing           | Vitest + React Testing Library + `axios-mock-adapter` | Fast, co-located tests                            |

---

## 5. Data Model

### `users` — HR staff who can log in

```sql
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  full_name        VARCHAR(255) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### `departments` — lookup table

```sql
CREATE TABLE departments (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) UNIQUE NOT NULL
  -- e.g. Engineering, Sales, HR, Finance, Marketing, Operations
);
```

### `employees` — core entity (10k records)

```sql
CREATE TABLE employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  full_name        VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email            VARCHAR(255) UNIQUE NOT NULL,
  job_title        VARCHAR(150) NOT NULL,
  department_id    INTEGER REFERENCES departments(id),
  country          VARCHAR(100) NOT NULL,
  salary           NUMERIC(12, 2) NOT NULL,  -- stored in USD
  employment_type  VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
  hire_date        DATE NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  termination_date DATE,                      -- set when is_active → false
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

**Why USD?** Salaries are normalised to USD to enable meaningful cross-country aggregations (min/max/avg). Storing in local currency would require live FX rates to produce any cross-country insight — significant complexity with no benefit for this use case.

### Indexes (performance-critical with 10k rows + frequent aggregations)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- required for GIN text search index

CREATE INDEX idx_employees_country        ON employees(country);
CREATE INDEX idx_employees_job_title      ON employees(job_title);
CREATE INDEX idx_employees_country_title  ON employees(country, job_title);
CREATE INDEX idx_employees_is_active      ON employees(is_active);
CREATE INDEX idx_employees_full_name      ON employees USING gin(full_name gin_trgm_ops); -- text search
```

---

## 6. API Design

All routes versioned under `/api/v1/`.

**Standard response envelope:**

```
Success: { data: T, meta?: { total, page, limit, nextCursor } }
Error:   { error: { code: string, message: string } }
```

### Auth

```
POST /api/v1/auth/login     → { data: { accessToken, user } } + sets httpOnly refresh cookie
POST /api/v1/auth/refresh   → { data: { accessToken } }  (reads refresh cookie)
POST /api/v1/auth/logout    → 204  (clears refresh cookie)
```

### Employees (JWT required)

```
GET    /api/v1/employees           → paginated list
       query params: country, job_title, is_active, search, limit, cursor
POST   /api/v1/employees           → create employee
GET    /api/v1/employees/:id       → single employee
PATCH  /api/v1/employees/:id       → partial update
DELETE /api/v1/employees/:id       → soft delete (is_active=false, termination_date=today)
```

### Insights (JWT required)

```
GET /api/v1/insights/salary-by-country             → min/max/avg salary per country
GET /api/v1/insights/salary-by-jobtitle?country=X  → avg salary per job title in a country
GET /api/v1/insights/summary                       → total employees, avg salary, headcount by country/dept, active vs former count
```

**Validation:** All request bodies and query params validated with Zod before any business logic runs.
**Rate limiting:** Auth endpoints limited to 20 requests/minute per IP.

**Why separate insight endpoints?** The three insight endpoints serve different lifecycles. `/summary` and `/salary-by-country` load once on page mount. `/salary-by-jobtitle` is user-driven — it refetches every time the HR manager selects a different country from the dropdown. Consolidating into one endpoint would force a full refetch of all data on every country change. Keeping them separate allows TanStack Query to cache each independently: summary and by-country are fetched once and reused; by-jobtitle refetches only when the filter changes. All three fire in parallel on page mount — no waterfall, no performance cost.

---

## 7. Backend Project Structure

```
backend/src/
  routes/         → route definitions (thin, delegates immediately)
  controllers/    → request parsing, response formatting (no business logic)
  services/       → business logic (pure functions where possible)
  repositories/   → all DB access (services never query DB directly)
  middleware/     → authenticate, authorize, errorHandler, rateLimiter
  db/             → pg pool config, migration runner
  config/         → env-loaded config (port, JWT secret, DB URL)
  types/          → shared TypeScript interfaces and Zod schemas
  utils/          → pure utility functions

backend/seeds/
  seed.ts
  first_names.txt
  last_names.txt
  data/           → jobTitles.ts, countries.ts, salaryMatrix.ts, departments.ts

backend/tests/
  unit/
    services/     → employeeService.test.ts, insightService.test.ts
    utils/        → salary.test.ts, pagination.test.ts
  integration/
    routes/       → auth.test.ts, employees.test.ts, insights.test.ts
```

**Golden rule:** A route handler is 5–10 lines. If longer, extract a service. A service is 20–50 lines. If longer, split concerns.

---

## 8. Frontend Project Structure

```
frontend/src/
  pages/              → Login.tsx, Employees.tsx, Insights.tsx (thin — layout + Suspense only)
  features/
    auth/             → LoginForm.tsx, useAuth.ts, LoginForm.test.tsx
    employees/        → EmployeeTable.tsx, EmployeeModal.tsx, hooks/, types/
                         EmployeeTable.test.tsx, EmployeeModal.test.tsx
    insights/         → SummaryCards.tsx, SalaryByCountryChart.tsx,
                         SalaryByJobTitleChart.tsx, HeadcountChart.tsx
                         hooks/, SummaryCards.test.tsx
  components/         → PageLayout.tsx, StatCard.tsx (shared, stateless, props-only)
  services/           → auth.ts, employees.ts, insights.ts (axios + TanStack Query keys)
  router/             → index.tsx (route definitions + auth guard)
  store/              → authStore.ts (Zustand — accessToken in memory only)
  lib/                → formatCurrency.ts, constants.ts
  types/              → Employee.ts, User.ts, InsightSummary.ts
```

### Pages

| Route        | Page      | Description                                                                                                                                |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/login`     | Login     | Email + password form. Redirects to `/employees` on success.                                                                               |
| `/employees` | Employees | MUI DataGrid with search, country/status filters, pagination. Add/Edit/Deactivate via modal.                                               |
| `/insights`  | Insights  | Stat cards (summary) + bar chart (salary by country) + horizontal bar chart (salary by job title) + donut chart (headcount by department). |

**Auth guard:** Unauthenticated users are redirected to `/login` from any protected route. Guard is at the router level — not scattered in components.

---

## 9. Auth Flow

```
Access token:  15 min TTL → Zustand store (memory only, never localStorage)
Refresh token: 7 day TTL  → httpOnly, Secure, SameSite=Strict cookie
```

1. HR submits email + password → `POST /api/v1/auth/login`
2. Backend verifies password with `bcryptjs`, returns access token + sets refresh cookie
3. Frontend stores access token in Zustand, redirects to `/employees`
4. Axios request interceptor attaches `Authorization: Bearer <token>` to every API call
5. On 401 → response interceptor calls `/auth/refresh` once → retries original request
6. If refresh fails → clears auth state → redirects to `/login`

---

## 10. Seed Script

**Goal:** Insert 10,000 realistic employees in < 5 seconds. Script must be safely re-runnable.

**Strategy:**

- Read `first_names.txt` + `last_names.txt` into memory once at startup
- Generate all 10k records in JavaScript (pure CPU, no DB round trips)
- Salary determined by **country × job title matrix** (realistic local market rates in USD)
- Insert in **batches of 1,000** using multi-row `INSERT` → 10 DB round trips total
- Wrap all inserts in a **single transaction** — atomic, fast rollback on failure
- `ON CONFLICT (email) DO NOTHING` — idempotent, safe to re-run

**Seeded data characteristics:**

- Names: random first + last from txt files
- Countries: weighted distribution (US/UK/DE/IN/CA/AU/SG)
- Salary: realistic range per country × job title (e.g. Software Engineer US: $90k–$160k, IN: $8k–$25k)
- Hire dates: spread across last 10 years
- ~5% of employees seeded as `is_active = false` with a past termination date

---

## 11. Testing Strategy (TDD-first)

Every feature follows **Red → Green → Refactor**:

1. Write a failing test defining expected behaviour
2. Write minimum code to make it pass
3. Refactor without breaking the test

**Commit cadence:** `red commit → green commit → refactor commit` — TDD discipline is visible in git history.

### Backend (Jest + Supertest)

TDD order per feature:

```
1. Write service unit test → fails
2. Implement service → passes
3. Write repository unit test → fails
4. Implement repository → passes
5. Write route integration test (Supertest) → fails
6. Wire route → controller → service → passes
```

**Why Supertest?** It fires real HTTP requests against the Express app in-process (no server startup needed), testing the full stack — route → controller → service → repository → real test DB — in a single test. This catches wiring bugs that pure unit tests miss.

Test DB: separate `salary_management_test` database, migrations run before suite, tables truncated between tests. No DB mocks — real queries catch real bugs.

### Frontend (Vitest + React Testing Library)

TDD order per feature:

```
1. Write service test (API call shape, axios-mock-adapter) → fails
2. Implement service → passes
3. Write component test (what the user sees/does) → fails
4. Implement component → passes
```

**Rules:**

- Tests describe **behaviour**, not implementation details
- One clear assertion per test — easy to diagnose on failure
- Test files co-located with components: `EmployeeTable.tsx` → `EmployeeTable.test.tsx`
- Every component handles: loading, error, empty, and success states

---

## 12. Dependencies

### Backend

```json
"dependencies": {
  "express": "^4.18",
  "pg": "^8.11",
  "bcryptjs": "^2.4",
  "jsonwebtoken": "^9.0",
  "cookie-parser": "^1.4",
  "zod": "^3.22",
  "pino": "^8.15",
  "pino-pretty": "^10.2",
  "helmet": "^7.1",
  "cors": "^2.8",
  "express-rate-limit": "^7.1",
  "dotenv": "^16.3"
},
"devDependencies": {
  "typescript": "^5.3",
  "tsx": "^4.6",
  "nodemon": "^3.0",
  "jest": "^29.7",
  "supertest": "^6.3",
  "ts-jest": "^29.1",
  "@types/express": "^4.17",
  "@types/pg": "^8.10",
  "@types/bcryptjs": "^2.4",
  "@types/jsonwebtoken": "^9.0",
  "@types/cookie-parser": "^1.4",
  "@types/cors": "^2.8",
  "@types/supertest": "^6.0",
  "@types/jest": "^29.5"
}
```

### Frontend

```json
"dependencies": {
  "react": "^18.2",
  "react-dom": "^18.2",
  "@mui/material": "^5.15",
  "@mui/icons-material": "^5.15",
  "@mui/x-data-grid": "^6.18",
  "@mui/x-charts": "^6.18",
  "@emotion/react": "^11.11",
  "@emotion/styled": "^11.11",
  "@tanstack/react-query": "^5.17",
  "@tanstack/react-router": "^1.14",
  "zustand": "^4.4",
  "react-hook-form": "^7.49",
  "zod": "^3.22",
  "@hookform/resolvers": "^3.3",
  "axios": "^1.6"
},
"devDependencies": {
  "typescript": "^5.3",
  "vite": "^5.0",
  "@vitejs/plugin-react": "^4.2",
  "vitest": "^1.1",
  "@testing-library/react": "^14.1",
  "@testing-library/user-event": "^14.5",
  "@testing-library/jest-dom": "^6.2",
  "axios-mock-adapter": "^1.22",
  "jsdom": "^23.0",
  "vite-bundle-visualizer": "^0.10"
}
```

---

## 13. Key Trade-offs

| Decision                 | Chosen                                          | Alternative                 | Why                                                                                |
| ------------------------ | ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| Salary currency          | USD (normalised)                                | Local currency              | Cross-country aggregations require a single unit; FX complexity not warranted here |
| Employee delete          | Soft delete (`is_active=false`)                 | Hard delete                 | Preserves audit trail and historical records; HR compliance                        |
| Former employee tracking | `is_active` boolean + `termination_date`        | Status enum with `on_leave` | `on_leave` implies a full leave management system — out of scope                   |
| ORM                      | Raw SQL via `pg`                                | Prisma / TypeORM            | Transparent, fast, no magic for performance-critical seed + aggregation queries    |
| Auth token storage       | Zustand memory (FE) + httpOnly cookie (refresh) | localStorage                | localStorage is XSS-vulnerable; httpOnly cookie is inaccessible to JS              |
| Pagination               | Cursor-based                                    | Offset-based                | Offset degrades on large tables; cursor is O(1) regardless of page depth           |
| Deployment               | Local                                           | AWS / Railway               | Scope of assessment; Docker Compose keeps it reproducible                          |

claude --resume 4c980311-4631-4224-9bed-01d90ba95e8c
