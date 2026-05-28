import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';

vi.mock('../../hooks/useInsights', () => ({
  useSalaryByJobTitle: vi.fn(),
}));

import { SalaryByJobTitleTable } from './SalaryByJobTitleTable';
import { useSalaryByJobTitle } from '../../hooks/useInsights';

const mockHook = useSalaryByJobTitle as Mock;

describe('SalaryByJobTitleTable', () => {
  it('renders job titles, formatted avg salaries, and employee counts', () => {
    mockHook.mockReturnValue({
      data: [
        { job_title: 'Software Engineer', avg_salary: 110000, employee_count: 40 },
        { job_title: 'Product Manager', avg_salary: 95000, employee_count: 20 },
      ],
      isLoading: false,
    });
    render(<SalaryByJobTitleTable />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('$110,000')).toBeInTheDocument();
    expect(screen.getByText(/^40$/)).toBeInTheDocument();
  });

  it('shows loading spinner while fetching', () => {
    mockHook.mockReturnValue({ data: [], isLoading: true });
    render(<SalaryByJobTitleTable />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state message when no data for the selected country', () => {
    mockHook.mockReturnValue({ data: [], isLoading: false });
    render(<SalaryByJobTitleTable />);
    expect(screen.getByText(/no salary data for/i)).toBeInTheDocument();
  });

  it('defaults to US and passes it to useSalaryByJobTitle', () => {
    mockHook.mockReturnValue({ data: [], isLoading: false });
    render(<SalaryByJobTitleTable />);
    expect(mockHook).toHaveBeenCalledWith('US');
    expect(screen.getByText('No salary data for US')).toBeInTheDocument();
  });

  it('calls useSalaryByJobTitle with new country when country filter changes', async () => {
    mockHook.mockReturnValue({ data: [], isLoading: false });
    render(<SalaryByJobTitleTable />);
    
    const countryTrigger = screen.getByRole('combobox', { name: /country/i });
    await userEvent.click(countryTrigger);
    await userEvent.click(screen.getByRole('option', { name: 'UK' }));
    expect(mockHook).toHaveBeenCalledWith('UK');
  });
});
