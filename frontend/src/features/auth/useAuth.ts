import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types';

export function useAuth() {
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, accessToken } = useAuthStore();

  const handleLoginSuccess = (token: string, user: User) => {
    setAuth(token, user);
    navigate({ to: '/employees' });
  };

  return { handleLoginSuccess, clearAuth, user, isAuthenticated: !!accessToken };
}
