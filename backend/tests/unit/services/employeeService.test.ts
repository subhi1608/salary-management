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
