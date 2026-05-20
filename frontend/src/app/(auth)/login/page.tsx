'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/modules/auth/services';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, password });
      setAuth(response.data.user);
      router.replace('/patients');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-[400px] space-y-5 px-4">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 backdrop-blur">
          <AlertTriangle className="h-4 w-4" />
          BCP LOCAL MODE — Offline clinical data only
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5">
              <Image src="/athma-mark.svg" alt="Athma" width={32} height={32} className="brightness-0 invert" />
              <div>
                <p className="text-lg font-bold tracking-wide text-white">edge</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">BCP Console</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-white/70">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/70">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30">
          Hospital Business Continuity Plan System
        </p>
      </div>
    </div>
  );
}
