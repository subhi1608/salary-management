import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ConfirmDeactivateModal } from './ConfirmDeactivateModal';

describe('ConfirmDeactivateModal', () => {
  it('is not in the document when open=false', () => {
    render(
      <ConfirmDeactivateModal
        open={false}
        employeeName="Jane Doe"
        isLoading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and employee name when open=true', () => {
    render(
      <ConfirmDeactivateModal
        open
        employeeName="Jane Doe"
        isLoading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('calls onCancel and does not call onConfirm when Cancel clicked', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDeactivateModal
        open
        employeeName="Jane Doe"
        isLoading={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Deactivate button clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDeactivateModal
        open
        employeeName="Jane Doe"
        isLoading={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables Deactivate button when isLoading=true', () => {
    render(
      <ConfirmDeactivateModal
        open
        employeeName="Jane Doe"
        isLoading={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /deactivate/i })).toBeDisabled();
  });
});
