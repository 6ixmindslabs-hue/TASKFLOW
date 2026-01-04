import { Layout } from '@/components/Layout';
import { CreateUserDialog } from '@/components/CreateUserDialog';
import { useUsers } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users as UsersIcon, CheckSquare, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function Users() {
  const { users, loading } = useUsers();
  const { tasks } = useTasks();

  const userStats = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(t => t.assigned_to === user.user_id);
      const total = userTasks.length;
      const completed = userTasks.filter(t => t.status === 'done').length;
      const active = userTasks.filter(t => t.status !== 'done').length;
      return {
        ...user,
        total,
        completed,
        active,
      };
    });
  }, [users, tasks]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage team members and their roles
            </p>
          </div>
          <CreateUserDialog />
        </div>

        {/* Users grid */}
        {userStats.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
            <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new user to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.map(user => (
              <Card key={user.id} className="shadow-card border-border/50 hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center group-hover:shadow-glow transition-shadow">
                        <span className="text-primary-foreground font-bold text-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.username}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-1 capitalize',
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {user.role || 'member'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{user.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-warning mb-1">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold text-warning">{user.active}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-success mb-1">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-bold text-success">{user.completed}</p>
                      <p className="text-xs text-muted-foreground">Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
