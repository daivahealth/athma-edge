'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuthGuard() {
  const router = useRouter();
  const { user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  return { user, isAuthenticated: hydrated && !!user, isLoading: !hydrated };
}

export function useRoleGuard(requiredRoles: string[]) {
  const { user } = useAuthGuard();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.roles.some((r) => requiredRoles.includes(r))) {
      router.replace('/patients');
    }
  }, [user, requiredRoles, router]);

  return { user, hasAccess: user?.roles.some((r) => requiredRoles.includes(r)) ?? false };
}
