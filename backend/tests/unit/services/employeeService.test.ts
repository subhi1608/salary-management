import * as employeeRepo from '../../../src/repositories/employeeRepository';
import {
  buildEmployeeFiltersQuery,
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from '../../../src/services/employeeService';
import { AppError } from '../../../src/types';
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

describe('listEmployees', () => {
  it('calls findEmployees with filters and pagination and returns the result', async () => {
    jest.mocked(employeeRepo.findEmployees).mockResolvedValue(mockPaginated);

    const result = await listEmployees(mockPool, { country: 'US', page: 1, limit: 25 });

    expect(employeeRepo.findEmployees).toHaveBeenCalledWith(
      mockPool,
      'WHERE 1=1 AND country = $1',
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

  it('throws NOT_FOUND when employee does not exist', async () => {
    jest.mocked(employeeRepo.findEmployeeById).mockResolvedValue(null);

    await expect(getEmployee(mockPool, 'nonexistent'))
      .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
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

  it('throws NOT_FOUND when employee does not exist', async () => {
    jest.mocked(employeeRepo.updateEmployee).mockResolvedValue(null);

    await expect(updateEmployee(mockPool, 'nonexistent', { salary: 120000 }))
      .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });
});

describe('deactivateEmployee', () => {
  it('delegates to the repository and returns the deactivated employee', async () => {
    const deactivated = { ...mockEmployee, is_active: false, termination_date: '2024-06-01' };
    jest.mocked(employeeRepo.softDeleteEmployee).mockResolvedValue(deactivated);

    const result = await deactivateEmployee(mockPool, 'emp-1');

    expect(employeeRepo.softDeleteEmployee).toHaveBeenCalledWith(mockPool, 'emp-1');
    expect(result).toEqual(deactivated);
  });

  it('throws NOT_FOUND when employee does not exist', async () => {
    jest.mocked(employeeRepo.softDeleteEmployee).mockResolvedValue(null);

    await expect(deactivateEmployee(mockPool, 'nonexistent'))
      .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });
});
