import { Task, TaskStatus } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, User, MoreVertical, Trash2, Clock, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const { isAdmin, user } = useAuth();

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/10 text-warning border-warning/30',
    high: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  const statusColors = {
    todo: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary border-primary/30',
    done: 'bg-success/10 text-success border-success/30',
  };

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };

  const getDueDateStatus = () => {
    if (!task.due_date || task.status === 'done') return null;

    const dueDate = new Date(task.due_date);

    if (isPast(dueDate) && !isToday(dueDate)) {
      return 'overdue';
    }
    if (isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 2))) {
      return 'soon';
    }
    return null;
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <Card className="shadow-card hover:shadow-lg transition-all duration-300 animate-fade-in border-border/50 overflow-hidden group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          {isAdmin && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn('capitalize', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className={cn(statusColors[task.status])}>
            {statusLabels[task.status]}
          </Badge>
        </div>

        {/* Meta info */}
        <div className="flex flex-col gap-2 text-sm">
          {task.assigned_user && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{task.assigned_user.username}</span>
            </div>
          )}
          {task.due_date && (
            <div
              className={cn(
                'flex items-center gap-2',
                dueDateStatus === 'overdue' && 'text-destructive',
                dueDateStatus === 'soon' && 'text-warning',
                !dueDateStatus && 'text-muted-foreground'
              )}
            >
              {dueDateStatus === 'overdue' ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span>
                {format(new Date(task.due_date), 'MMM d, yyyy')}
                {dueDateStatus === 'overdue' && ' (Overdue)'}
                {dueDateStatus === 'soon' && ' (Due soon)'}
              </span>
            </div>
          )}
        </div>

        {/* Status update buttons */}
        {task.status !== 'done' && user?.id === task.assigned_to && (
          <div className="flex gap-2 pt-2">
            {task.status === 'todo' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                onClick={() => onStatusChange(task.id, 'in_progress')}
              >
                Start Task
              </Button>
            )}
            {task.status === 'in_progress' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onStatusChange(task.id, 'todo')}
                >
                  Move to To Do
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gradient-primary text-primary-foreground border-0 hover:opacity-90"
                  onClick={() => onStatusChange(task.id, 'done')}
                >
                  Complete
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
