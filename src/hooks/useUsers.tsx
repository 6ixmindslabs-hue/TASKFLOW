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

    // Create auth user using edge function
    const { data: result, error: signUpError } = await supabase.functions.invoke('create-user', {
      body: {
        email: data.email,
        password: data.password,
        username: data.username,
        role: data.role,
      },
    });

    if (signUpError || result?.error) {
      const errorMessage = result?.error || signUpError?.message || 'Failed to create user';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }

    toast.success('User created successfully');
    fetchUsers();
    return { error: null };
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
    refetch: fetchUsers,
  };
}
