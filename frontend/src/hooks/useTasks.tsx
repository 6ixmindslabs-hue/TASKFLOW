import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, Profile } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useTasks(showOnlyMyTasks: boolean = false) {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Fetch tasks with user profiles in a single query using join
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(*)
        `);

      // If showOnlyMyTasks is true OR user is not admin, filter by assigned_to
      if (showOnlyMyTasks || !isAdmin) {
        query = query.eq('assigned_to', user.id);
      }

      const { data: tasksData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        setLoading(false);
        return;
      }

      // Map the data to match the Task type
      const tasksWithProfiles = (tasksData || []).map(task => ({
        ...task,
        assigned_user: task.assigned_user || undefined,
      })) as Task[];

      setTasks(tasksWithProfiles);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, showOnlyMyTasks, isAdmin]);

  const createTask = async (task: {
    title: string;
    description?: string;
    assigned_to: string;
    priority: string;
    due_date?: string;
  }) => {
    if (!user || !isAdmin) return { error: new Error('Unauthorized') };

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description || null,
        assigned_to: task.assigned_to,
        created_by: user.id,
        priority: task.priority as Task['priority'],
        due_date: task.due_date || null,
        status: 'todo' as TaskStatus,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
      return { error };
    }

    // Create notification for assigned user
    if (task.assigned_to) {
      await supabase.from('notifications').insert({
        user_id: task.assigned_to,
        message: `You have been assigned a new task: "${task.title}"`,
        task_id: data.id,
      });
    }

    toast.success('Task created successfully');
    fetchTasks();
    return { error: null, data };
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!user) return { error: new Error('Unauthorized') };

    const task = tasks.find(t => t.id === taskId);
    if (!task) return { error: new Error('Task not found') };

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task status');
      return { error };
    }

    // If task is marked as done, notify admin
    if (status === 'done' && task.created_by !== user.id) {
      // Get admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles) {
        for (const admin of adminRoles) {
          await supabase.from('notifications').insert({
            user_id: admin.user_id,
            message: `Task "${task.title}" has been completed`,
            task_id: taskId,
          });
        }
      }
    }

    toast.success('Task status updated');
    fetchTasks();
    return { error: null };
  };

  const updateTask = async (taskId: string, updates: {
    title?: string;
    description?: string;
    assigned_to?: string;
    priority?: string;
    due_date?: string;
  }) => {
    if (!user || !isAdmin) return { error: new Error('Unauthorized') };

    const { error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description || null,
        assigned_to: updates.assigned_to,
        priority: updates.priority as Task['priority'],
        due_date: updates.due_date || null,
      })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task');
      return { error };
    }

    toast.success('Task updated successfully');
    fetchTasks();
    return { error: null };
  };

  const deleteTask = async (taskId: string) => {
    if (!user || !isAdmin) return { error: new Error('Unauthorized') };

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to delete task');
      return { error };
    }

    toast.success('Task deleted');
    fetchTasks();
    return { error: null };
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    refetch: fetchTasks,
  };
}
