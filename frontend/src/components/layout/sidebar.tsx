
import { Link, useLocation } from 'react-router-dom';
import { Users, Search, Activity, FileText, ClipboardPen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/modules/auth/services';

const navItems = [
  { href: '/patients', label: 'Patient Search', icon: Search, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
  { href: '/clinical-notes', label: 'Clinical Notes', icon: ClipboardPen, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
  { href: '/admin/sync', label: 'Sync Status', icon: Activity, roles: ['ADMIN'] },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { pathname } = useLocation();
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
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/athma-mark.svg" alt="Athma" width={28} height={28} className="brightness-0 invert" />
        <div>
          <p className="text-sm font-bold tracking-wide text-white">edge</p>
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">BCP Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all',
                isActive
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-white',
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-lg bg-sidebar-muted px-3 py-2">
          <p className="text-xs font-medium text-white">{user?.fullName || user?.username}</p>
          <p className="text-[10px] text-sidebar-foreground/50">{userRoles.join(', ')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-muted hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
