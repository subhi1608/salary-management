# HR Portal — Salary Management

Internal HR and payroll management tool. Manage employees across countries, track salary data, and view workforce analytics.

**Stack:** Express + TypeScript + PostgreSQL (backend) · React + MUI + TanStack (frontend)

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option A — Local PostgreSQL](#option-a--local-postgresql)
- [Option B — PostgreSQL via Docker (no local install needed)](#option-b--postgresql-via-docker-no-local-install-needed)
- [Seeding](#seeding)
- [Running the app](#running-the-app)
- [Default credentials](#default-credentials)
- [Running tests](#running-tests)
- [Project structure](#project-structure)

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm 9+** — comes with Node
- **PostgreSQL 15** — either local (Option A) or via Docker (Option B)
- **Docker** — required for Option B and Option C — [docker.com](https://www.docker.com/get-started)

---

## Option A — Local PostgreSQL

Use this if PostgreSQL is already installed on your machine.

### 1. Create the databases

Open `psql` (or any PostgreSQL client) and run:

```sql
CREATE DATABASE salary_management;
CREATE DATABASE salary_management_test;
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your values:

> Replace `postgres` and `your_password` with your actual PostgreSQL user and password.

### 3. Install dependencies and run migrations

```bash
cd backend
npm install
npm run migrate
```

`migrate` reads every `.sql` file from `src/db/migrations/` in order and applies them:

| File                         | Creates                          |
| ---------------------------- | -------------------------------- |
| `001_create_extensions.sql`  | `pgcrypto`, `pg_trgm` extensions |
| `002_create_users.sql`       | `users` table                    |
| `003_create_departments.sql` | `departments` table + seed rows  |
| `004_create_employees.sql`   | `employees` table with GIN index |

### 4. Create the admin user

```bash
npm run seed:admin
```

Output:

```
Admin user created:
  Email:    admin@salary.local
  Password: Admin1234!
Change the password after first login.
```

Running this again when the user already exists prints `Admin already exists` and does nothing.

### 5. (Optional) Seed 10,000 employees

```bash
npm run seed
```

This inserts 10,000 realistic employees in batches of 1,000 inside a single transaction. Safe to re-run — uses `ON CONFLICT DO NOTHING`.

---

## Option B — PostgreSQL via Docker (no local install needed)

Use this if PostgreSQL is **not** installed locally. Docker runs only the database; Node runs natively.

### 1. Start a PostgreSQL container

```bash
docker run --name salary-pg \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=salary_management \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 2. Create the test database

```bash
docker exec -it salary-pg psql -U postgres -c "CREATE DATABASE salary_management_test;"
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

`backend/.env`:

### 4. Install, migrate, and seed

```bash
cd backend
npm install
npm run migrate
npm run seed:admin
npm run seed        # optional — loads 10,000 employees
```

### 5. Stop the container when done

```bash
docker stop salary-pg
docker start salary-pg   # to restart it later
```

## Seeding

| Command              | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `npm run seed:admin` | Creates `admin@salary.local` / `Admin1234!`. Idempotent.          |
| `npm run seed`       | Inserts 10,000 employees. Safe to re-run (deduplicates by email). |

Both commands are in `backend/`. The seed script runs migrations automatically before inserting data.

---

## Running the app

After completing any of the options above:

**Backend** (Terminal 1):

```bash
cd backend
npm run dev
```

**Frontend** (Terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000**. You will be redirected to the login page.

---

## Default credentials

```
Email:    admin@salary.local
Password: Admin1234!
```

> Change the password after first login. There is no self-service password change UI yet — update it directly in the database:
>
> ```sql
> UPDATE users SET password_hash = crypt('new_password', gen_salt('bf')) WHERE email = 'admin@salary.local';
> ```

---

## Running tests

**Backend** (requires `TEST_DATABASE_URL` in `backend/.env` and the test DB to exist):

```bash
cd backend
npm test
```

Tests run against a real PostgreSQL database (`salary_management_test`). Tables are truncated between tests; no mocking.

**Frontend:**

```bash
cd frontend
npm test
```

Frontend tests run in jsdom with Vitest + React Testing Library. No backend or database required.

---

## Project structure

```
salary-management/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app factory
│   │   ├── config/             # Environment config
│   │   ├── db/                 # Pool, migrations
│   │   ├── middleware/         # Auth, error handler
│   │   ├── routes/             # auth, employees, insights
│   │   ├── services/           # Business logic
│   │   └── types/              # Shared TypeScript types
│   ├── seeds/
│   │   ├── createAdmin.ts      # Admin user seed
│   │   └── seed.ts             # 10,000 employee seed
│   └── tests/                  # Jest + Supertest integration tests
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client with token refresh
│   │   ├── components/         # PageLayout, StatCard
│   │   ├── features/           # auth, employees, insights
│   │   ├── pages/              # Login, Employees, Insights
│   │   ├── router/             # TanStack Router with auth guard
│   │   ├── services/           # API calls
│   │   ├── store/              # Zustand auth store
│   │   └── theme.ts            # MUI theme
│   └── (Vitest + RTL tests)
├── docker-compose.yml
├── .env.example
└── PRODUCT.md
```

---

## API endpoints

| Method | Path                                  | Auth   | Description                                       |
| ------ | ------------------------------------- | ------ | ------------------------------------------------- |
| POST   | `/api/v1/auth/login`                  | No     | Login, returns access token + sets refresh cookie |
| POST   | `/api/v1/auth/refresh`                | Cookie | Refresh access token                              |
| POST   | `/api/v1/auth/logout`                 | Cookie | Clear refresh token                               |
| GET    | `/api/v1/employees`                   | Bearer | List employees (paginated, filterable)            |
| POST   | `/api/v1/employees`                   | Bearer | Create employee                                   |
| GET    | `/api/v1/employees/:id`               | Bearer | Get employee by ID                                |
| PATCH  | `/api/v1/employees/:id`               | Bearer | Update employee                                   |
| DELETE | `/api/v1/employees/:id`               | Bearer | Deactivate employee (soft delete)                 |
| GET    | `/api/v1/employees/departments`       | Bearer | List departments                                  |
| GET    | `/api/v1/insights/summary`            | Bearer | Headcount and avg salary summary                  |
| GET    | `/api/v1/insights/salary-by-country`  | Bearer | Salary stats grouped by country                   |
| GET    | `/api/v1/insights/salary-by-jobtitle` | Bearer | Avg salary by job title (filterable by country)   |
