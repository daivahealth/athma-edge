'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Users, Search, Activity, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/modules/auth/services';

const navItems = [
  { href: '/patients', label: 'Patient Search', icon: Search, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
  { href: '/admin/sync', label: 'Sync Status', icon: Activity, roles: ['ADMIN'] },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText, roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const userRoles = user?.roles ?? [];

  const visibleItems = navItems.filter((item) => item.roles.some((r) => userRoles.includes(r)));

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Image src="/athma-mark.svg" alt="Athma" width={32} height={32} />
        <div>
          <p className="text-sm font-bold">edge</p>
          <p className="text-xs text-muted-foreground">BCP Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 px-3 text-xs text-muted-foreground">
          {user?.username} ({userRoles.join(', ')})
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
