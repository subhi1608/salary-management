import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email, password fields and sign in button', () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'bad-email');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'hr@company.com');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls onSuccess on valid credentials', async () => {
    const onSuccess = vi.fn();
    const loginFn = vi.fn().mockResolvedValue({
      accessToken: 'tok', user: { id: '1', email: 'hr@company.com', full_name: 'HR' },
    });
    render(<LoginForm onSuccess={onSuccess} loginFn={loginFn} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'hr@company.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('tok', expect.objectContaining({ email: 'hr@company.com' })));
  });

  it('shows server error message on failed login', async () => {
    const loginFn = vi.fn().mockRejectedValue({ response: { data: { error: { message: 'Invalid credentials' } } } });
    render(<LoginForm onSuccess={vi.fn()} loginFn={loginFn} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'hr@company.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
