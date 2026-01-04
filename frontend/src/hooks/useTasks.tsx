import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, Profile } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useTasks() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch only tasks assigned to the current user
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for assigned users
    const userIds = [...new Set((tasksData || []).map(t => t.assigned_to).filter(Boolean))];

    let profilesMap: Record<string, Profile> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesData) {
        profilesMap = (profilesData as Profile[]).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, Profile>);
      }
    }

    const tasksWithProfiles = (tasksData || []).map(task => ({
      ...task,
      assigned_user: task.assigned_to ? profilesMap[task.assigned_to] : undefined,
    })) as Task[];

    setTasks(tasksWithProfiles);
    setLoading(false);
  };

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
  }, [user]);

  return {
    tasks,
    loading,
    createTask,
    updateTaskStatus,
    deleteTask,
    refetch: fetchTasks,
  };
}
