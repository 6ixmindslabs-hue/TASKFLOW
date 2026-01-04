export type AppRole = 'admin' | 'member';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  priority: TaskPriority;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
  assigned_user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  task_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  profile?: Profile;
  role?: AppRole;
}
