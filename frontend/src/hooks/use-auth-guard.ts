import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuthGuard() {
  const navigate = useNavigate();
  const { user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      navigate('/login', { replace: true });
    }
  }, [hydrated, user, navigate]);

  return { user, isAuthenticated: hydrated && !!user, isLoading: !hydrated };
}

export function useRoleGuard(requiredRoles: string[]) {
  const { user } = useAuthGuard();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.roles.some((r) => requiredRoles.includes(r))) {
      navigate('/patients', { replace: true });
    }
  }, [user, requiredRoles, navigate]);

  return { user, hasAccess: user?.roles.some((r) => requiredRoles.includes(r)) ?? false };
}
