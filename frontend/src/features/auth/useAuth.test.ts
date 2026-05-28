import { renderHook, act } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from './useAuth';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}));

const mockUser: User = { id: '1', email: 'hr@example.com', full_name: 'HR Admin' };

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ accessToken: null, user: null });
});

describe('useAuth', () => {
  it('isAuthenticated is false and user is null when store has no token', () => {
    (useNavigate as Mock).mockReturnValue(vi.fn());
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('isAuthenticated is true and user is set when store has a token', () => {
    useAuthStore.setState({ accessToken: 'tok-123', user: mockUser });
    (useNavigate as Mock).mockReturnValue(vi.fn());
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('handleLoginSuccess stores token and user then navigates to /employees', () => {
    const mockNavigate = vi.fn();
    (useNavigate as Mock).mockReturnValue(mockNavigate);
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.handleLoginSuccess('new-token', mockUser);
    });

    expect(useAuthStore.getState().accessToken).toBe('new-token');
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/employees' });
  });

  it('clearAuth removes token and user from store', () => {
    useAuthStore.setState({ accessToken: 'tok-123', user: mockUser });
    (useNavigate as Mock).mockReturnValue(vi.fn());
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.clearAuth();
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
