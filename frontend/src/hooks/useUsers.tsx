import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserWithRole extends Profile {
  role?: AppRole;
}

export function useUsers() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get sanitized API URL
  const getApiUrl = () => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return url.replace(/\/$/, '');
  };

  const fetchUsers = async () => {
    if (!user) return;

    setLoading(true);

    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      return;
    }

    // Fetch roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*');

    const rolesMap: Record<string, AppRole> = {};
    if (rolesData) {
      rolesData.forEach(r => {
        rolesMap[r.user_id] = r.role as AppRole;
      });
    }

    const usersWithRoles = (profilesData as Profile[]).map(p => ({
      ...p,
      role: rolesMap[p.user_id],
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const createUser = async (data: {
    email: string;
    password: string;
    username: string;
    role: AppRole;
  }) => {
    if (!user || !isAdmin) return { error: new Error('Unauthorized') };

    try {
      const response = await fetch(`${getApiUrl()}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          username: data.username,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMessage = result.error || 'Failed to create user';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
      }

      toast.success('User created successfully');
      fetchUsers();
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const updateUser = async (userId: string, data: {
    username?: string;
    role?: AppRole;
    password?: string;
  }) => {
    if (!user || !isAdmin) return { error: new Error('Unauthorized') };

    try {
      const response = await fetch(`${getApiUrl()}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMessage = result.error || 'Failed to update user';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
      }

      toast.success('User updated successfully');
      fetchUsers();
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user || !isAdmin) return { error: new Error('Unauthorized') };

    try {
      const response = await fetch(`${getApiUrl()}/api/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        const errorMessage = result.error || 'Failed to delete user';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
      }

      toast.success('User deleted successfully');
      fetchUsers();
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
}
