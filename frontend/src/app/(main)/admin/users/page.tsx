'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useUsers } from '@/modules/admin/hooks';
import { adminService } from '@/modules/admin/services';
import { ROLES } from '@/lib/utils/constants';
import { formatDateTime } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function UserManagementPage() {
  const { hasAccess } = useRoleGuard(['ADMIN']);
  const { data, isLoading } = useUsers();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '' });
  const [roleDialogUser, setRoleDialogUser] = useState<{ id: number; username: string; roleCodes: string[] } | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setForm({ username: '', password: '', fullName: '', email: '' });
    },
  });

  const rolesMutation = useMutation({
    mutationFn: ({ id, roleCodes }: { id: number; roleCodes: string[] }) =>
      adminService.assignRoles(id, { roleCodes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleDialogUser(null);
    },
  });

  if (!hasAccess) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <Input placeholder="Username" required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
              <Input placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              <Input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
              {createMutation.isError && (
                <p className="text-sm text-destructive">
                  {(createMutation.error as any)?.response?.data?.message || 'Failed to create user'}
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(data?.data) ? data.data : []).map((user) => {
                  const roleCodes = user.roles.map((r: any) => typeof r === 'string' ? r : r.roleCode);
                  return (
                    <tr key={user.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3">{user.fullName || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {roleCodes.map((r: string) => (
                            <Badge key={r} variant="secondary">{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRoleDialogUser({ id: user.id, username: user.username, roleCodes });
                            setSelectedRoles(roleCodes);
                          }}
                        >
                          Roles
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!roleDialogUser} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Roles — {roleDialogUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {ROLES.map((role) => (
              <label key={role} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={(e) =>
                    setSelectedRoles((prev) =>
                      e.target.checked ? [...prev, role] : prev.filter((r) => r !== role),
                    )
                  }
                  className="rounded"
                />
                <span className="text-sm">{role}</span>
              </label>
            ))}
            <Button
              className="w-full"
              disabled={rolesMutation.isPending}
              onClick={() => {
                if (roleDialogUser) {
                  rolesMutation.mutate({ id: roleDialogUser.id, roleCodes: selectedRoles });
                }
              }}
            >
              {rolesMutation.isPending ? 'Saving...' : 'Save Roles'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
