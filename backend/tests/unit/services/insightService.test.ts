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
    expect(result).toEqual([{ job_title: 'Engineer', avg_salary: 85000.55, employee_count: 5 }]);
  });

  it('handles empty array', () => {
    expect(normaliseJobTitleStats([])).toEqual([]);
  });
});

describe('getSalaryByCountry', () => {
  it('calls the repository and returns normalised salary stats', async () => {
    const rawRows = [
      { country: 'US', min_salary: '50000', max_salary: '150000', avg_salary: '99999.999', employee_count: '10' },
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
