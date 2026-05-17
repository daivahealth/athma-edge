'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuthGuard() {
  const router = useRouter();
  const { token, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const stored = localStorage.getItem('bcp_token');
    if (!stored) {
      router.replace('/login');
    }
  }, [token, router]);

  return { user, isAuthenticated: !!token };
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
