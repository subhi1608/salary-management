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
