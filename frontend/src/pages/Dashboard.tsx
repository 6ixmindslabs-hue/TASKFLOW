import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { TaskCard } from '@/components/TaskCard';
import { StatsCard } from '@/components/StatsCard';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { isPast, isToday } from 'date-fns';

export default function Dashboard() {
  const { isAdmin, profile } = useAuth();
  const { tasks, loading, updateTaskStatus, deleteTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const stats = useMemo(() => {
    const myTasks = tasks;
    const total = myTasks.length;
    const todo = myTasks.filter(t => t.status === 'todo').length;
    const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
    const done = myTasks.filter(t => t.status === 'done').length;
    const overdue = myTasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      const dueDate = new Date(t.due_date);
      return isPast(dueDate) && !isToday(dueDate);
    }).length;

    return { total, todo, inProgress, done, overdue };
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        // Prioritize overdue tasks
        const aOverdue = a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date));
        const bOverdue = b.due_date && isPast(new Date(b.due_date)) && !isToday(new Date(b.due_date));
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [tasks]);

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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground line-clamp-2">
              Welcome back, <span className="text-gradient leading-tight">{profile?.username}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your tasks today
            </p>
          </div>
          {isAdmin && <CreateTaskDialog />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Tasks"
            value={stats.total}
            icon={<CheckSquare className="w-6 h-6" />}
            variant="primary"
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
          />
          <StatsCard
            title="Completed"
            value={stats.done}
            icon={<CheckCircle className="w-6 h-6" />}
            variant="success"
          />
          <StatsCard
            title="Overdue"
            value={stats.overdue}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="destructive"
          />
        </div>

        {/* Recent Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Active Tasks</h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
              <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No active tasks</p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new task to get started
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={updateTaskStatus}
                  onEdit={isAdmin ? setEditingTask : undefined}
                  onDelete={isAdmin ? deleteTask : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Task Dialog */}
        {editingTask && (
          <EditTaskDialog
            task={editingTask}
            onSuccess={() => setEditingTask(null)}
          />
        )}
      </div>
    </Layout>
  );
}
