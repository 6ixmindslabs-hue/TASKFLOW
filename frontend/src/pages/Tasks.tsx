import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { TaskCard } from '@/components/TaskCard';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, CheckSquare, Filter } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { TaskStatus, Task } from '@/types';

export default function Tasks() {
  const { isAdmin } = useAuth();
  const { tasks, loading, updateTaskStatus, deleteTask } = useTasks(true); // Show only my tasks
  const { users } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all' | 'overdue'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(query) &&
          !task.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'overdue') {
        if (!task.due_date || task.status === 'done') return false;
        const dueDate = new Date(task.due_date);
        if (!isPast(dueDate) || isToday(dueDate)) return false;
      } else if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // User filter
      if (userFilter !== 'all' && task.assigned_to !== userFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, userFilter]);

  const groupedTasks = useMemo(() => {
    const todo = filteredTasks.filter(t => t.status === 'todo');
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress');
    const done = filteredTasks.filter(t => t.status === 'done');
    return { todo, inProgress, done };
  }, [filteredTasks]);

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
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
            </p>
          </div>
          {isAdmin && <CreateTaskDialog />}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus-visible:ring-primary"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-36 focus:ring-primary">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-40 focus:ring-primary">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Tasks by status */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
            <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No tasks found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* To Do */}
            {groupedTasks.todo.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  To Do ({groupedTasks.todo.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.todo.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={updateTaskStatus}
                      onEdit={isAdmin ? setEditingTask : undefined}
                      onDelete={isAdmin ? deleteTask : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {groupedTasks.inProgress.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  In Progress ({groupedTasks.inProgress.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.inProgress.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={updateTaskStatus}
                      onEdit={isAdmin ? setEditingTask : undefined}
                      onDelete={isAdmin ? deleteTask : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Done */}
            {groupedTasks.done.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Completed ({groupedTasks.done.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedTasks.done.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={updateTaskStatus}
                      onEdit={isAdmin ? setEditingTask : undefined}
                      onDelete={isAdmin ? deleteTask : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
