import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EmployeeTable } from './EmployeeTable';
import { Employee } from '../../types';

const emp: Employee = {
  id: '1', first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe',
  email: 'jane@co.com', job_title: 'Software Engineer', department_id: 1,
  country: 'US', salary: 120000, employment_type: 'full_time',
  hire_date: '2022-01-01', is_active: true, termination_date: null,
  created_at: '2022-01-01T00:00:00Z', updated_at: '2022-01-01T00:00:00Z',
};

describe('EmployeeTable', () => {
  it('renders employee name, job title, and formatted salary', () => {
    render(<EmployeeTable employees={[emp]} total={1} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={vi.fn()} onDeactivate={vi.fn()} loading={false} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
  });

  it('shows loading indicator when loading=true', () => {
    render(<EmployeeTable employees={[]} total={0} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={vi.fn()} onDeactivate={vi.fn()} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onEdit when Edit clicked', async () => {
    const onEdit = vi.fn();
    render(<EmployeeTable employees={[emp]} total={1} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={onEdit} onDeactivate={vi.fn()} loading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(emp);
  });

  it('calls onDeactivate when Deactivate clicked', async () => {
    const onDeactivate = vi.fn();
    render(<EmployeeTable employees={[emp]} total={1} page={1} pageSize={25}
      onPageChange={vi.fn()} onEdit={vi.fn()} onDeactivate={onDeactivate} loading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    expect(onDeactivate).toHaveBeenCalledWith('1');
  });
});
