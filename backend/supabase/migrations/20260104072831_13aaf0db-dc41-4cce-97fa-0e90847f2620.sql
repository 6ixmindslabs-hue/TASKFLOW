-- Allow service role to bypass RLS (it already does by default)
-- But we need to allow the first admin to be created

-- Create a policy to allow inserting profiles during user creation (for service role)
-- The service role already bypasses RLS, so this is just for clarity

-- Drop the restrictive insert policy and create a more permissive one for service role operations
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;

-- Recreate with service role consideration - service role bypasses RLS anyway
CREATE POLICY "Admins or service role can insert profiles" 
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Same for user_roles
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

CREATE POLICY "Admins or service role can insert roles" 
ON public.user_roles FOR INSERT
TO authenticated  
WITH CHECK (public.has_role(auth.uid(), 'admin'));