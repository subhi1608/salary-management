import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { EmployeeModal } from './EmployeeModal';

const departments = [{ id: 1, name: 'Engineering' }];

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
});
