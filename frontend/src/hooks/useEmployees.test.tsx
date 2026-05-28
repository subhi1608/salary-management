import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import React from 'react';
import {
  useEmployees, useDepartments, useCreateEmployee,
  useUpdateEmployee, useDeactivateEmployee,
} from './useEmployees';
import {
  fetchEmployees, fetchDepartments, createEmployee,
  updateEmployee, deactivateEmployee,
} from '../services/employees';
import type { Employee, PaginatedEmployees, CreateEmployeeInput } from '../types';

vi.mock('../services/employees', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../services/employees')>();
  return {
    ...mod,
    fetchEmployees: vi.fn(),
    fetchDepartments: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deactivateEmployee: vi.fn(),
  };
});

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

const mockEmployee: Employee = {
  id: '1', first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe',
  email: 'jane@co.com', job_title: 'Engineer', department_id: 1,
  country: 'US', salary: 120000, employment_type: 'full_time',
  hire_date: '2022-01-01', is_active: true, termination_date: null,
  created_at: '2022-01-01T00:00:00Z', updated_at: '2022-01-01T00:00:00Z',
};

const mockPaginated: PaginatedEmployees = {
  employees: [mockEmployee], total: 1, page: 1, limit: 25, totalPages: 1,
};

const mockCreateInput: CreateEmployeeInput = {
  first_name: 'Jane', last_name: 'Doe', email: 'jane@co.com',
  job_title: 'Engineer', department_id: 1, country: 'US',
  salary: 120000, employment_type: 'full_time', hire_date: '2022-01-01',
};

beforeEach(() => { vi.clearAllMocks(); });

describe('useEmployees', () => {
  it('returns paginated employees from fetchEmployees', async () => {
    vi.mocked(fetchEmployees).mockResolvedValue(mockPaginated);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEmployees({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPaginated);
    expect(fetchEmployees).toHaveBeenCalledWith({});
  });

  it('passes filters through to fetchEmployees', async () => {
    vi.mocked(fetchEmployees).mockResolvedValue(mockPaginated);
    const { wrapper } = createWrapper();
    const filters = { country: 'US', page: 2 };
    const { result } = renderHook(() => useEmployees(filters), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchEmployees).toHaveBeenCalledWith(filters);
  });

  it('is pending before fetch resolves', () => {
    vi.mocked(fetchEmployees).mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEmployees({}), { wrapper });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns error state when fetchEmployees rejects', async () => {
    vi.mocked(fetchEmployees).mockRejectedValue(new Error('Network error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEmployees({}), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDepartments', () => {
  it('returns departments from fetchDepartments', async () => {
    const depts = [{ id: 1, name: 'Engineering' }];
    vi.mocked(fetchDepartments).mockResolvedValue(depts);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDepartments(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(depts);
  });
});

describe('useCreateEmployee', () => {
  it('calls createEmployee with input and invalidates employee queries on success', async () => {
    vi.mocked(createEmployee).mockResolvedValue(mockEmployee);
    const { qc, wrapper } = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    act(() => { result.current.mutate(mockCreateInput); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    
    expect(createEmployee).toHaveBeenCalledWith(mockCreateInput, expect.any(Object));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['employees'] });
  });

  it('enters error state when createEmployee rejects', async () => {
    vi.mocked(createEmployee).mockRejectedValue(new Error('Conflict'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    act(() => { result.current.mutate(mockCreateInput); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateEmployee', () => {
  it('calls updateEmployee with id and input and invalidates employee queries on success', async () => {
    vi.mocked(updateEmployee).mockResolvedValue(mockEmployee);
    const { qc, wrapper } = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

    act(() => { result.current.mutate({ id: '1', input: { salary: 130000 } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    
    expect(updateEmployee).toHaveBeenCalledWith('1', { salary: 130000 });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['employees'] });
  });

  it('enters error state when updateEmployee rejects', async () => {
    vi.mocked(updateEmployee).mockRejectedValue(new Error('Not found'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

    act(() => { result.current.mutate({ id: '99', input: { salary: 1 } }); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeactivateEmployee', () => {
  it('calls deactivateEmployee with id and invalidates employee queries on success', async () => {
    vi.mocked(deactivateEmployee).mockResolvedValue(mockEmployee);
    const { qc, wrapper } = createWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeactivateEmployee(), { wrapper });

    act(() => { result.current.mutate('1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    
    expect(deactivateEmployee).toHaveBeenCalledWith('1', expect.any(Object));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['employees'] });
  });

  it('enters error state when deactivateEmployee rejects', async () => {
    vi.mocked(deactivateEmployee).mockRejectedValue(new Error('Not found'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeactivateEmployee(), { wrapper });

    act(() => { result.current.mutate('99'); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
