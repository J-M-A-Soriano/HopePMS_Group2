-- Migration: 10_user_role_management
-- Purpose: Enable RLS on the public."user" table and restrict role modifications to Superadmins.

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

-- 1. Create a secure function to check for Superadmin privileges
-- We use SECURITY DEFINER to bypass RLS and prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."user"
    WHERE userid = auth.uid() 
    AND user_type = 'SUPERADMIN'
    AND record_status = 'ACTIVE'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create a secure function for Admins
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."user"
    WHERE userid = auth.uid() 
    AND user_type IN ('ADMIN', 'SUPERADMIN')
    AND record_status = 'ACTIVE'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Read Policies
-- Users can see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public."user";
CREATE POLICY "Users can view own profile" ON public."user"
    FOR SELECT USING (userid = auth.uid());

-- Admins and Superadmins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON public."user";
CREATE POLICY "Admins can view all users" ON public."user"
    FOR SELECT USING (public.is_admin_or_superadmin());

-- 3. Write Policies
-- ONLY Superadmins can update the user table (like changing user_type or record_status)
DROP POLICY IF EXISTS "Superadmins can update users" ON public."user";
CREATE POLICY "Superadmins can update users" ON public."user"
    FOR UPDATE USING (public.is_superadmin());

-- Optional: Allow users to update their own profile (except user_type and record_status)
-- This is a bit tricky without column-level security. Since we only want Superadmins to update roles,
-- and there's no UI for users to update their own profile currently, we'll keep it strictly Superadmin-only for now.
