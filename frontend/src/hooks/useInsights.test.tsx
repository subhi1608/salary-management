import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import React from 'react';
import { useSummary, useSalaryByCountry, useSalaryByJobTitle } from './useInsights';
import { fetchSummary, fetchSalaryByCountry, fetchSalaryByJobTitle } from '../services/insights';
import type { InsightSummary, SalaryByCountry, SalaryByJobTitle } from '../types';

vi.mock('../services/insights', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../services/insights')>();
  return {
    ...mod,
    fetchSummary: vi.fn(),
    fetchSalaryByCountry: vi.fn(),
    fetchSalaryByJobTitle: vi.fn(),
  };
});

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

const mockSummary: InsightSummary = {
  total_employees: 10000, active_employees: 9500, former_employees: 500, avg_salary: 75000,
  headcount_by_country: [{ country: 'US', count: 5000 }],
  headcount_by_department: [{ department: 'Engineering', count: 2000 }],
};

const mockSalaryByCountry: SalaryByCountry[] = [
  { country: 'US', min_salary: 50000, max_salary: 150000, avg_salary: 90000, employee_count: 120 },
];

const mockSalaryByJobTitle: SalaryByJobTitle[] = [
  { job_title: 'Software Engineer', avg_salary: 110000, employee_count: 40 },
];

beforeEach(() => { vi.clearAllMocks(); });

describe('useSummary', () => {
  it('returns summary data on success', async () => {
    vi.mocked(fetchSummary).mockResolvedValue(mockSummary);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSummary(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSummary);
    expect(fetchSummary).toHaveBeenCalledTimes(1);
  });

  it('is pending before fetch resolves', () => {
    vi.mocked(fetchSummary).mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSummary(), { wrapper });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns error state when fetchSummary rejects', async () => {
    vi.mocked(fetchSummary).mockRejectedValue(new Error('Network error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSummary(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});

describe('useSalaryByCountry', () => {
  it('returns salary-by-country data on success', async () => {
    vi.mocked(fetchSalaryByCountry).mockResolvedValue(mockSalaryByCountry);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSalaryByCountry(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSalaryByCountry);
    expect(fetchSalaryByCountry).toHaveBeenCalledTimes(1);
  });

  it('returns error state when fetchSalaryByCountry rejects', async () => {
    vi.mocked(fetchSalaryByCountry).mockRejectedValue(new Error('Network error'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSalaryByCountry(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useSalaryByJobTitle', () => {
  it('fetches data for the given country', async () => {
    vi.mocked(fetchSalaryByJobTitle).mockResolvedValue(mockSalaryByJobTitle);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSalaryByJobTitle('US'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSalaryByJobTitle);
    expect(fetchSalaryByJobTitle).toHaveBeenCalledWith('US');
  });

  it('does not fire when country is an empty string', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSalaryByJobTitle(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchSalaryByJobTitle).not.toHaveBeenCalled();
  });

  it('refetches when country changes', async () => {
    vi.mocked(fetchSalaryByJobTitle).mockResolvedValue(mockSalaryByJobTitle);
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ country }: { country: string }) => useSalaryByJobTitle(country),
      { wrapper, initialProps: { country: 'US' } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchSalaryByJobTitle).toHaveBeenCalledWith('US');

    rerender({ country: 'UK' });
    await waitFor(() => expect(fetchSalaryByJobTitle).toHaveBeenCalledWith('UK'));
  });

  it('returns error state when fetchSalaryByJobTitle rejects', async () => {
    vi.mocked(fetchSalaryByJobTitle).mockRejectedValue(new Error('Not found'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSalaryByJobTitle('US'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
