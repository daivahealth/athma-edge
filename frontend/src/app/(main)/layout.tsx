'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { BcpBanner } from '@/components/layout/bcp-banner';
import { Sidebar } from '@/components/layout/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthGuard();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BcpBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
