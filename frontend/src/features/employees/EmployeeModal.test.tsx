import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EmployeeModal } from './EmployeeModal';
import { Employee } from '../../types';

const departments = [{ id: 1, name: 'Engineering' }];

const existingEmployee: Employee = {
  id: '1', first_name: 'Jane', last_name: 'Doe', full_name: 'Jane Doe',
  email: 'jane@co.com', job_title: 'Engineer', department_id: 1,
  country: 'US', salary: 120000, employment_type: 'full_time',
  hire_date: '2022-01-01', is_active: true, termination_date: null,
  created_at: '2022-01-01T00:00:00Z', updated_at: '2022-01-01T00:00:00Z',
};

describe('EmployeeModal', () => {
  it('renders all required form fields', () => {
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salary/i)).toBeInTheDocument();
  });

  it('shows validation error when first name is empty', async () => {
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/first name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Wong');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@co.com');
    await userEvent.type(screen.getByLabelText(/job title/i), 'Engineer');
    await userEvent.type(screen.getByLabelText(/salary/i), '100000');
    await userEvent.type(screen.getByLabelText(/hire date/i), '2024-01-01');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('calls onClose when Cancel clicked', async () => {
    const onClose = vi.fn();
    render(<EmployeeModal open mode="create" departments={departments} onClose={onClose} onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error when last name is empty', async () => {
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/first name/i), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/last name is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    render(<EmployeeModal open mode="create" departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/first name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Wong');
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('pre-fills fields with employee data in edit mode', async () => {
    render(<EmployeeModal open mode="edit" employee={existingEmployee}
      departments={departments} onClose={vi.fn()} onSubmit={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue('Jane');
    });
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('jane@co.com');
    expect(screen.getByLabelText(/salary/i)).toHaveValue(120000);
  });
});
