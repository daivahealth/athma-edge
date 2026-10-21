import { Outlet } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { BcpBanner } from '@/components/layout/bcp-banner';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthGuard();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Non-dismissible and above everything: this banner is the reminder
          that the data on screen is a frozen local copy. */}
      <BcpBanner />
      <SidebarProvider className="min-h-0 flex-1">
        <Sidebar />
        <SidebarInset className="min-h-0">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="text-foreground/70 hover:bg-accent hover:text-foreground" />
          </header>
          <div className="flex-1 overflow-auto p-6 lg:p-8">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
