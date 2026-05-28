# Backend Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all integration tests with focused service-layer unit tests covering the core happy-path functionality of authService, employeeService, and insightService.

**Architecture:** Use `jest.mock()` to auto-mock repository modules at the top of each test file. Tests use `jest.mocked(fn).mockResolvedValue(...)` to control repository return values and assert on service behaviour — no real database, no Pool, no network. Existing 7 unit test cases are preserved verbatim; 11 new cases are added.

**Tech Stack:** TypeScript, Jest 29, ts-jest, bcryptjs, jsonwebtoken, zod, pg

---

## File Map

| Action | Path |
|--------|------|
| Delete | `backend/tests/integration/routes/auth.test.ts` |
| Delete | `backend/tests/integration/routes/employees.test.ts` |
| Delete | `backend/tests/integration/routes/insights.test.ts` |
| Delete | `backend/tests/globalSetup.ts` |
| Delete | `backend/tests/globalTeardown.ts` |
| Delete | `backend/tests/setup.ts` |
| Update | `backend/jest.config.ts` |
| Create | `backend/tests/unit/services/authService.test.ts` |
| Replace | `backend/tests/unit/services/employeeService.test.ts` |
| Replace | `backend/tests/unit/services/insightService.test.ts` |

---

## Task 1: Remove integration tests and DB infrastructure

**Files:**
- Delete: `backend/tests/integration/routes/auth.test.ts`
- Delete: `backend/tests/integration/routes/employees.test.ts`
- Delete: `backend/tests/integration/routes/insights.test.ts`
- Delete: `backend/tests/globalSetup.ts`
- Delete: `backend/tests/globalTeardown.ts`
- Delete: `backend/tests/setup.ts`
- Modify: `backend/jest.config.ts`

- [ ] **Step 1: Delete the integration test directory and DB infrastructure files**

Run from `backend/`:
```bash
rm -rf tests/integration tests/globalSetup.ts tests/globalTeardown.ts tests/setup.ts
```

- [ ] **Step 2: Update `jest.config.ts` to remove DB hooks**

Replace the entire file with:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 30000,
};

export default config;
```

- [ ] **Step 3: Verify Jest can still find the existing unit tests**

Run from `backend/`:
```
npm run test:unit
```

Expected: 2 test suites pass, 7 tests pass, 0 failures.

- [ ] **Step 4: Commit**

```bash
git add jest.config.ts tests/
git commit -m "test: remove integration tests and DB test infrastructure"
```

---

## Task 2: Add authService unit tests

**Files:**
- Create: `backend/tests/unit/services/authService.test.ts`

**What is being tested:**
- `login()` — calls `findUserByEmail`, compares password with bcrypt, signs two JWTs, returns tokens + user without `password_hash`
- `refreshAccessToken()` — verifies refresh JWT, signs new access JWT, returns token + userId

- [ ] **Step 1: Create `tests/unit/services/authService.test.ts`**

```typescript
import * as userRepo from '../../../src/repositories/userRepository';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { login, refreshAccessToken } from '../../../src/services/authService';

jest.mock('../../../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPool = {} as import('pg').Pool;

const mockDbUser = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  password_hash: 'hashed-pw',
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login', () => {
  it('returns accessToken, refreshToken, and user without password_hash for valid credentials', async () => {
    jest.mocked(userRepo.findUserByEmail).mockResolvedValue(mockDbUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock)
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await login(mockPool, { email: 'test@example.com', password: 'password123' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toMatchObject({ id: 'user-1', email: 'test@example.com', full_name: 'Test User' });
    expect(result.user).not.toHaveProperty('password_hash');
    expect(userRepo.findUserByEmail).toHaveBeenCalledWith(mockPool, 'test@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-pw');
  });
});

describe('refreshAccessToken', () => {
  it('returns a new accessToken and userId for a valid refresh token', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
    (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

    const result = await refreshAccessToken('valid-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.userId).toBe('user-1');
  });
});
```

- [ ] **Step 2: Run the new tests to verify they pass**

Run from `backend/`:
```
npx jest --runInBand tests/unit/services/authService.test.ts
```

Expected output:
```
PASS tests/unit/services/authService.test.ts
  login
    ✓ returns accessToken, refreshToken, and user without password_hash for valid credentials
  refreshAccessToken
    ✓ returns a new accessToken and userId for a valid refresh token

Tests: 2 passed, 2 total
```

- [ ] **Step 3: Commit**

```bash
git add tests/unit/services/authService.test.ts
git commit -m "test: add authService unit tests for login and refreshAccessToken"
```

---

## Task 3: Expand employeeService unit tests

**Files:**
- Replace: `backend/tests/unit/services/employeeService.test.ts`

**What is being tested (new cases):**
- `listEmployees()` — calls `findEmployees` with WHERE clause built from filters plus page/limit
- `getEmployee()` — calls `findEmployeeById`, returns employee
- `createEmployee()` — delegates to `repo.createEmployee`, returns created employee
- `updateEmployee()` — delegates to `repo.updateEmployee`, returns updated employee
- `deactivateEmployee()` — delegates to `repo.softDeleteEmployee`, returns deactivated employee

Existing 5 `buildEmployeeFiltersQuery` tests are preserved verbatim.

- [ ] **Step 1: Replace `tests/unit/services/employeeService.test.ts`**

```typescript
import * as employeeRepo from '../../../src/repositories/employeeRepository';
import {
  buildEmployeeFiltersQuery,
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from '../../../src/services/employeeService';
import type { Employee, PaginatedEmployees, CreateEmployeeInput } from '../../../src/types';

jest.mock('../../../src/repositories/employeeRepository');

const mockPool = {} as import('pg').Pool;

const mockEmployee: Employee = {
  id: 'emp-1',
  first_name: 'Jane',
  last_name: 'Doe',
  full_name: 'Jane Doe',
  email: 'jane@example.com',
  job_title: 'Engineer',
  department_id: 1,
  country: 'US',
  salary: 100000,
  employment_type: 'full_time',
  hire_date: '2022-01-01',
  is_active: true,
  termination_date: null,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2022-01-01T00:00:00Z',
};

const mockPaginated: PaginatedEmployees = {
  employees: [mockEmployee],
  total: 1,
  page: 1,
  limit: 25,
  totalPages: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── existing tests (preserved) ──────────────────────────────────────────────

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

// ── new tests ────────────────────────────────────────────────────────────────

describe('listEmployees', () => {
  it('calls findEmployees with filters and pagination and returns the result', async () => {
    jest.mocked(employeeRepo.findEmployees).mockResolvedValue(mockPaginated);

    const result = await listEmployees(mockPool, { country: 'US', page: 1, limit: 25 });

    expect(employeeRepo.findEmployees).toHaveBeenCalledWith(
      mockPool,
      expect.stringContaining('country = $1'),
      ['US'],
      1,
      25,
    );
    expect(result).toEqual(mockPaginated);
  });
});

describe('getEmployee', () => {
  it('returns the employee when found by id', async () => {
    jest.mocked(employeeRepo.findEmployeeById).mockResolvedValue(mockEmployee);

    const result = await getEmployee(mockPool, 'emp-1');

    expect(employeeRepo.findEmployeeById).toHaveBeenCalledWith(mockPool, 'emp-1');
    expect(result).toEqual(mockEmployee);
  });
});

describe('createEmployee', () => {
  it('delegates to the repository and returns the created employee', async () => {
    const input: CreateEmployeeInput = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      job_title: 'Engineer',
      department_id: 1,
      country: 'US',
      salary: 100000,
      employment_type: 'full_time',
      hire_date: '2022-01-01',
    };
    jest.mocked(employeeRepo.createEmployee).mockResolvedValue(mockEmployee);

    const result = await createEmployee(mockPool, input);

    expect(employeeRepo.createEmployee).toHaveBeenCalledWith(mockPool, input);
    expect(result).toEqual(mockEmployee);
  });
});

describe('updateEmployee', () => {
  it('delegates to the repository and returns the updated employee', async () => {
    const updated = { ...mockEmployee, salary: 120000 };
    jest.mocked(employeeRepo.updateEmployee).mockResolvedValue(updated);

    const result = await updateEmployee(mockPool, 'emp-1', { salary: 120000 });

    expect(employeeRepo.updateEmployee).toHaveBeenCalledWith(mockPool, 'emp-1', { salary: 120000 });
    expect(result).toEqual(updated);
  });
});

describe('deactivateEmployee', () => {
  it('delegates to the repository and returns the deactivated employee', async () => {
    const deactivated = { ...mockEmployee, is_active: false, termination_date: '2024-06-01' };
    jest.mocked(employeeRepo.softDeleteEmployee).mockResolvedValue(deactivated);

    const result = await deactivateEmployee(mockPool, 'emp-1');

    expect(employeeRepo.softDeleteEmployee).toHaveBeenCalledWith(mockPool, 'emp-1');
    expect(result.is_active).toBe(false);
    expect(result.termination_date).toBe('2024-06-01');
  });
});
```

- [ ] **Step 2: Run the employee service tests to verify all 10 pass**

Run from `backend/`:
```
npx jest --runInBand tests/unit/services/employeeService.test.ts
```

Expected output:
```
PASS tests/unit/services/employeeService.test.ts
  buildEmployeeFiltersQuery
    ✓ returns base query with no filters
    ✓ adds country filter
    ✓ adds is_active filter
    ✓ adds search filter using ILIKE
    ✓ combines multiple filters
  listEmployees
    ✓ calls findEmployees with filters and pagination and returns the result
  getEmployee
    ✓ returns the employee when found by id
  createEmployee
    ✓ delegates to the repository and returns the created employee
  updateEmployee
    ✓ delegates to the repository and returns the updated employee
  deactivateEmployee
    ✓ delegates to the repository and returns the deactivated employee

Tests: 10 passed, 10 total
```

- [ ] **Step 3: Commit**

```bash
git add tests/unit/services/employeeService.test.ts
git commit -m "test: expand employeeService unit tests to cover all service functions"
```

---

## Task 4: Expand insightService unit tests

**Files:**
- Replace: `backend/tests/unit/services/insightService.test.ts`

**What is being tested (new cases):**
- `normaliseJobTitleStats()` — parses raw DB row strings to numbers, rounds avg_salary to 2 dp
- `getSalaryByCountry()` — calls repo, passes raw rows through `normaliseSalaryStats`
- `getSalaryByJobTitle()` — calls repo with country arg, passes rows through `normaliseJobTitleStats`
- `getInsightSummary()` — delegates directly to repo, returns result unchanged

Existing 2 `normaliseSalaryStats` tests are preserved verbatim.

- [ ] **Step 1: Replace `tests/unit/services/insightService.test.ts`**

```typescript
import * as insightRepo from '../../../src/repositories/insightRepository';
import {
  normaliseSalaryStats,
  normaliseJobTitleStats,
  getSalaryByCountry,
  getSalaryByJobTitle,
  getInsightSummary,
} from '../../../src/services/insightService';
import type { InsightSummary } from '../../../src/types';

jest.mock('../../../src/repositories/insightRepository');

const mockPool = {} as import('pg').Pool;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── existing tests (preserved) ──────────────────────────────────────────────

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

// ── new tests ────────────────────────────────────────────────────────────────

describe('normaliseJobTitleStats', () => {
  it('parses avg_salary and employee_count from raw DB strings', () => {
    const result = normaliseJobTitleStats([
      { job_title: 'Engineer', avg_salary: '85000.555', employee_count: '5' },
    ]);
    expect(result).toEqual([{ job_title: 'Engineer', avg_salary: 85000.56, employee_count: 5 }]);
  });
});

describe('getSalaryByCountry', () => {
  it('calls the repository and returns normalised salary stats', async () => {
    const rawRows = [
      { country: 'US', min_salary: '50000', max_salary: '150000', avg_salary: '100000', employee_count: '10' },
    ];
    jest.mocked(insightRepo.getSalaryByCountry).mockResolvedValue(rawRows);

    const result = await getSalaryByCountry(mockPool);

    expect(insightRepo.getSalaryByCountry).toHaveBeenCalledWith(mockPool);
    expect(result).toEqual([
      { country: 'US', min_salary: 50000, max_salary: 150000, avg_salary: 100000, employee_count: 10 },
    ]);
  });
});

describe('getSalaryByJobTitle', () => {
  it('calls the repository with country and returns normalised stats', async () => {
    const rawRows = [
      { job_title: 'Engineer', avg_salary: '95000.5', employee_count: '3' },
    ];
    jest.mocked(insightRepo.getSalaryByJobTitle).mockResolvedValue(rawRows);

    const result = await getSalaryByJobTitle(mockPool, 'US');

    expect(insightRepo.getSalaryByJobTitle).toHaveBeenCalledWith(mockPool, 'US');
    expect(result).toEqual([{ job_title: 'Engineer', avg_salary: 95000.5, employee_count: 3 }]);
  });
});

describe('getInsightSummary', () => {
  it('delegates to the repository and returns the summary unchanged', async () => {
    const mockSummary: InsightSummary = {
      total_employees: 100,
      active_employees: 90,
      former_employees: 10,
      avg_salary: 75000,
      headcount_by_country: [{ country: 'US', count: 50 }],
      headcount_by_department: [{ department: 'Engineering', count: 30 }],
    };
    jest.mocked(insightRepo.getInsightSummary).mockResolvedValue(mockSummary);

    const result = await getInsightSummary(mockPool);

    expect(insightRepo.getInsightSummary).toHaveBeenCalledWith(mockPool);
    expect(result).toEqual(mockSummary);
  });
});
```

- [ ] **Step 2: Run the insight service tests to verify all 6 pass**

Run from `backend/`:
```
npx jest --runInBand tests/unit/services/insightService.test.ts
```

Expected output:
```
PASS tests/unit/services/insightService.test.ts
  normaliseSalaryStats
    ✓ rounds avg_salary to 2 decimal places
    ✓ handles empty array
  normaliseJobTitleStats
    ✓ parses avg_salary and employee_count from raw DB strings
  getSalaryByCountry
    ✓ calls the repository and returns normalised salary stats
  getSalaryByJobTitle
    ✓ calls the repository with country and returns normalised stats
  getInsightSummary
    ✓ delegates to the repository and returns the summary unchanged

Tests: 6 passed, 6 total
```

- [ ] **Step 3: Commit**

```bash
git add tests/unit/services/insightService.test.ts
git commit -m "test: expand insightService unit tests to cover all service functions"
```

---

## Task 5: Full suite verification

- [ ] **Step 1: Run all unit tests together**

Run from `backend/`:
```
npm run test:unit
```

Expected output:
```
PASS tests/unit/services/authService.test.ts
PASS tests/unit/services/employeeService.test.ts
PASS tests/unit/services/insightService.test.ts

Test Suites: 3 passed, 3 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        < 5s
```

If any test fails, check the error message. Common issues:
- **`Cannot find module`** — the mock path in `jest.mock(...)` is wrong relative to the test file. Verify the path resolves to `backend/src/repositories/<name>`.
- **`is not a function`** — the service imports the repo as a named import but the mock didn't capture it. Ensure `jest.mock` is called before imports are resolved (it is hoisted automatically, so this usually means a path mismatch).
- **`received undefined`** on a `mockReturnValueOnce` chain — the order of calls differs from expected. Check how many times `jwt.sign` is called in the function under test.
