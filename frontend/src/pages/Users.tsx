import { Layout } from '@/components/Layout';
import { CreateUserDialog } from '@/components/CreateUserDialog';
import { EditUserDialog } from '@/components/EditUserDialog';
import { useUsers } from '@/hooks/useUsers';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Users as UsersIcon, CheckSquare, Clock, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export default function Users() {
  const { users, loading, deleteUser } = useUsers();
  const { tasks } = useTasks();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const handleDelete = async (userId: string) => {
    setDeletingUserId(userId);
    await deleteUser(userId);
    setDeletingUserId(null);
  };

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
                    <div className="flex gap-1">
                      <EditUserDialog
                        userId={user.user_id}
                        username={user.username}
                        role={user.role || 'member'}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingUserId === user.user_id}
                          >
                            {deletingUserId === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{user.username}</strong>?
                              This action cannot be undone and will remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 text-center">
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
                    <div className="col-span-2 xs:col-span-1">
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
