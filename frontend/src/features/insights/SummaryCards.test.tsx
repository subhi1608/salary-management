import { render, screen } from '@testing-library/react';
import { SummaryCards } from './SummaryCards';
import { InsightSummary } from '../../types';

const summary: InsightSummary = {
  total_employees: 10000, active_employees: 9500, former_employees: 500, avg_salary: 75000,
  headcount_by_country: [], headcount_by_department: [],
};

describe('SummaryCards', () => {
  it('renders total employees', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });
  it('renders active employees', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('9,500')).toBeInTheDocument();
  });
  it('renders avg salary as USD currency', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('$75,000')).toBeInTheDocument();
  });
  it('renders former employees', () => {
    render(<SummaryCards summary={summary} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
