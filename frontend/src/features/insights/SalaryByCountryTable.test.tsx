import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalaryByCountryTable } from './SalaryByCountryTable';
import { SalaryByCountry } from '../../types';

const data: SalaryByCountry[] = [
  { country: 'US', min_salary: 50000, avg_salary: 90000, max_salary: 150000, employee_count: 120 },
  { country: 'GB', min_salary: 40000, avg_salary: 70000, max_salary: 120000, employee_count: 45 },
];

describe('SalaryByCountryTable', () => {
  it('renders country names and formatted salaries', () => {
    render(<SalaryByCountryTable data={data} />);
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('GB')).toBeInTheDocument();
    expect(screen.getByText('$90,000')).toBeInTheDocument();
    expect(screen.getByText('$70,000')).toBeInTheDocument();
  });

  it('renders employee counts', () => {
    render(<SalaryByCountryTable data={data} />);
    const usRow = screen.getByText('US').closest('tr')!;
    const gbRow = screen.getByText('GB').closest('tr')!;
    expect(usRow).toHaveTextContent('120');
    expect(gbRow).toHaveTextContent('45');
  });

  it('sorts by avg_salary desc by default (US before GB)', () => {
    render(<SalaryByCountryTable data={data} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('US');
    expect(rows[2]).toHaveTextContent('GB');
  });

  it('toggles sort to asc when the active column header is clicked', async () => {
    render(<SalaryByCountryTable data={data} />);
    const avgSalaryHeader = screen.getByRole('button', { name: /avg salary/i });
    await userEvent.click(avgSalaryHeader);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('GB');
    expect(rows[2]).toHaveTextContent('US');
  });

  it('renders the heading with empty data', () => {
    render(<SalaryByCountryTable data={[]} />);
    expect(screen.getByText('Salary by Country (USD)')).toBeInTheDocument();
  });
});
