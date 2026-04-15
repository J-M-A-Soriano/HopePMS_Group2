-- M4 (Rights & Auth Specialist)
-- Sprint 4: Enterprise Hierarchy & Security Hardening
-- This script provides the command to upgrade the system's primary administrator to 'SUPERADMIN'

-- To activate Superadmin rights for multiple accounts (like yourself and your professor),
-- run this script in your Supabase SQL Editor. 
-- Make sure to replace the dummy emails with the exact emails used to register the accounts!

UPDATE public.user 
SET 
  user_type = 'SUPERADMIN',
  record_status = 'ACTIVE' -- Forces the accounts to be active immediately so they can log in
WHERE username IN (
  'jcesperanza@neu.edu.ph', 
  'johnmichaelsoriano76@gmail.com'
);
