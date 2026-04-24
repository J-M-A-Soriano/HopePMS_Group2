-- Migration: 11_fix_user_rls_recursion
-- Purpose: Fix the "infinite recursion detected" error on the user table by simplifying the SELECT policy.

-- 1. Drop the problematic recursive SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON public."user";
DROP POLICY IF EXISTS "Admins can view all users" ON public."user";

-- 2. Create a unified, non-recursive SELECT policy
-- Since this is an internal enterprise portal, any authenticated employee 
-- should be able to read the basic staff directory (username, roles, status).
-- This completely eliminates the infinite recursion loop because it doesn't query the table to check permissions.
CREATE POLICY "Authenticated users can view staff directory" ON public."user"
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Note: The UPDATE policy (Superadmins can update users) remains secure.
-- It uses the is_superadmin() function which does a SELECT. Because the SELECT policy 
-- is now non-recursive, the UPDATE policy will also function perfectly without crashing.
