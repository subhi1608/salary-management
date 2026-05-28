import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import Employees from './Employees';
import { Employee } from '../types';

vi.mock('../components/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const activeEmployee: Employee = {
  id: '1', first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe',
  email: 'jane@co.com', job_title: 'Engineer', department_id: 1,
  country: 'US', salary: 120000, employment_type: 'full_time',
  hire_date: '2022-01-01', is_active: true, termination_date: null,
  created_at: '2022-01-01T00:00:00Z', updated_at: '2022-01-01T00:00:00Z',
};

const mockMutate = vi.fn();

vi.mock('../hooks/useEmployees', () => ({
  useEmployees: () => ({ data: { employees: [activeEmployee], total: 1 }, isLoading: false }),
  useDepartments: () => ({ data: [] }),
  useCreateEmployee: () => ({ mutateAsync: vi.fn() }),
  useUpdateEmployee: () => ({ mutateAsync: vi.fn() }),
  useDeactivateEmployee: () => ({ mutate: mockMutate, isPending: false }),
}));

beforeEach(() => mockMutate.mockClear());

describe('Employees page — deactivate confirm flow', () => {
  it('opens confirm modal when Deactivate clicked and does not call mutate yet', async () => {
    render(<Employees />);
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Jane Doe')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not call mutate when Cancel clicked in modal', async () => {
    render(<Employees />);
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls deactivate mutate with employee id when modal Deactivate button clicked', async () => {
    render(<Employees />);
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /deactivate/i }));
    expect(mockMutate).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
