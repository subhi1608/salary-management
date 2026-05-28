# Backend Unit Tests Design

**Date:** 2026-05-27  
**Scope:** Replace integration tests with service-layer unit tests covering core functionality

---

## Context

The backend is a Node.js/Express/TypeScript app with PostgreSQL. It has 3 service files (authService, employeeService, insightService) sitting above a repository layer. Previously there were 5 test files: 3 integration tests (18 cases) and 2 unit tests (7 cases covering only helper functions). The integration tests required a live test database, which adds setup friction and is not needed for this app's test goals.

---

## Decision

- **Delete** all integration tests and DB-setup infrastructure
- **Add** unit tests for every public service function using `jest.mock()` at the repository boundary
- **Focus** on happy-path (core functionality); negative cases deprioritized
- **Keep** the 7 existing unit test cases (they are correct and cover helper functions)

---

## Mock Strategy

All three service test files use `jest.mock()` to auto-mock the repository module the service depends on. Each test uses `jest.mocked(repo.fn).mockResolvedValue(...)` to control return values. No real database, no Pool, no network.

`authService` additionally mocks `bcryptjs` and `jsonwebtoken` since it calls those directly.

---

## Files Changed

| Action | Path |
|--------|------|
| Delete | `tests/integration/` (entire directory) |
| Delete | `tests/globalSetup.ts` |
| Delete | `tests/globalTeardown.ts` |
| Delete | `tests/setup.ts` |
| Update | `jest.config.ts` — remove `globalSetup`, `globalTeardown`, `setupFilesAfterFramework` |
| New    | `tests/unit/services/authService.test.ts` |
| Expand | `tests/unit/services/employeeService.test.ts` |
| Expand | `tests/unit/services/insightService.test.ts` |

---

## Test Cases

### `authService.test.ts` (new — 2 cases)

Mocks: `../../../src/repositories/userRepository`, `bcryptjs`, `jsonwebtoken`

| Function | Case | What is asserted |
|---|---|---|
| `login()` | Valid credentials | Returns `accessToken`, `refreshToken`, `user` without `password_hash` |
| `refreshAccessToken()` | Valid refresh token | Returns new `accessToken` and `userId` |

### `employeeService.test.ts` (expand — +5 cases, 10 total)

Mocks: `../../../src/repositories/employeeRepository`

Existing cases (keep): `buildEmployeeFiltersQuery` — 5 cases covering base query, country filter, is_active filter, search ILIKE, combined filters.

| Function | Case | What is asserted |
|---|---|---|
| `listEmployees()` | Default pagination | Calls `findEmployees` with correct `where`/`params`/`page`/`limit`; returns paginated result |
| `getEmployee()` | Employee exists | Returns `Employee` matching the mocked repo return |
| `createEmployee()` | Valid input | Delegates to `repo.createEmployee`; returns created `Employee` |
| `updateEmployee()` | Valid input | Delegates to `repo.updateEmployee`; returns updated `Employee` |
| `deactivateEmployee()` | Employee exists | Delegates to `repo.softDeleteEmployee`; returns deactivated `Employee` |

### `insightService.test.ts` (expand — +4 cases, 6 total)

Mocks: `../../../src/repositories/insightRepository`

Existing cases (keep): `normaliseSalaryStats` — 2 cases covering rounding and empty array.

| Function | Case | What is asserted |
|---|---|---|
| `normaliseJobTitleStats()` | Raw DB row | `avg_salary` rounded to 2 dp; `employee_count` parsed as integer |
| `getSalaryByCountry()` | Repo returns rows | Calls repo; returns normalized `SalaryByCountry[]` |
| `getSalaryByJobTitle()` | Country provided | Calls repo with `country` arg; returns normalized `SalaryByJobTitle[]` |
| `getInsightSummary()` | Repo returns summary | Delegates to repo; returns `InsightSummary` unchanged |

---

## Total: 18 unit test cases

| File | Existing | New | Total |
|------|----------|-----|-------|
| `authService.test.ts` | 0 | 2 | 2 |
| `employeeService.test.ts` | 5 | 5 | 10 |
| `insightService.test.ts` | 2 | 4 | 6 |
| **Total** | **7** | **11** | **18** |

---

## Jest Config After Changes

Remove from `jest.config.ts`:
- `globalSetup` — was `./tests/globalSetup.ts`
- `globalTeardown` — was `./tests/globalTeardown.ts`
- `setupFilesAfterEnv` — was `./tests/setup.ts`

These are only needed for DB-backed integration tests. Unit tests run with no external dependencies.
