import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepartmentHeadcountTable } from './DepartmentHeadcountTable';
import { InsightSummary } from '../../types';

const summary: InsightSummary = {
  total_employees: 200, active_employees: 180, former_employees: 20, avg_salary: 80000,
  headcount_by_country: [],
  headcount_by_department: [
    { department: 'Engineering', count: 80 },
    { department: 'Sales', count: 30 },
  ],
};

describe('DepartmentHeadcountTable', () => {
  it('renders department names and headcounts', () => {
    render(<DepartmentHeadcountTable summary={summary} />);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText(/^80$/)).toBeInTheDocument();
    expect(screen.getByText(/^30$/)).toBeInTheDocument();
  });

  it('sorts by count desc by default (Engineering before Sales)', () => {
    render(<DepartmentHeadcountTable summary={summary} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Engineering');
    expect(rows[2]).toHaveTextContent('Sales');
  });

  it('toggles sort to asc when the Headcount header is clicked', async () => {
    render(<DepartmentHeadcountTable summary={summary} />);
    const headcountHeader = screen.getByRole('button', { name: /headcount/i });
    await userEvent.click(headcountHeader);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Sales');
    expect(rows[2]).toHaveTextContent('Engineering');
  });
});
