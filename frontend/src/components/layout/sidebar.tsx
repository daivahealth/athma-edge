import { Link, useLocation } from 'react-router-dom';
import { Users, Search, Activity, FileText, ClipboardPen, LogOut } from 'lucide-react';
import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/modules/auth/services';

const navGroups = [
  {
    label: 'Clinical',
    items: [
      { href: '/patients', label: 'Patient Search', icon: Search, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
      { href: '/clinical-notes', label: 'Clinical Notes', icon: ClipboardPen, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/sync', label: 'Sync Status', icon: Activity, roles: ['ADMIN'] },
      { href: '/admin/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
      { href: '/admin/audit', label: 'Audit Log', icon: FileText, roles: ['ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const { user, logout } = useAuthStore();
  const userRoles = user?.roles ?? [];
  const collapsed = state === 'collapsed';

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
    <SidebarShell collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1.5 py-2">
          <img src="/athma-mark.svg" alt="Athma" width={26} height={26} className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide text-sidebar-menu-item">edge</p>
              <p className="truncate text-[10px] uppercase tracking-widest text-sidebar-menu-label">BCP Console</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          const visible = group.items.filter((item) => item.roles.some((r) => userRoles.includes(r)));
          if (visible.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {visible.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <div className="rounded-md bg-sidebar-accent/60 px-3 py-2">
            <p className="truncate text-xs font-medium text-sidebar-menu-item">{user?.fullName || user?.username}</p>
            <p className="truncate text-[10px] text-sidebar-menu-label">{userRoles.join(', ')}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarShell>
  );
}
