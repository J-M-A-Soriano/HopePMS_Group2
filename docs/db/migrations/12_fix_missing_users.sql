-- Migration: 12_fix_missing_users
-- Purpose: Finds any users in auth.users that do not exist in public."user" and inserts them.
-- This fixes the "ID: PENDING" and "Error loading profile data" issues for accounts created before the trigger was active or if the trigger failed.

-- First, fix the strict constraint so it properly accepts INACTIVE pending accounts
ALTER TABLE public."user" DROP CONSTRAINT IF EXISTS chk_user_status;
ALTER TABLE public."user" ADD CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'));

DO $$
DECLARE
    au_record RECORD;
    assigned_role VARCHAR(20);
    assigned_status VARCHAR(20);
    assigned_staff_id VARCHAR(50);
    prefix VARCHAR(50);
BEGIN
    -- Get prefix from system config if it exists
    BEGIN
        SELECT blueprint_prefix INTO prefix FROM public.system_config WHERE id = 1;
    EXCEPTION WHEN undefined_table THEN
        prefix := 'HOPE-2026-';
    END;

    IF prefix IS NULL THEN
        prefix := 'HOPE-2026-';
    END IF;

    FOR au_record IN 
        SELECT id, email FROM auth.users WHERE id NOT IN (SELECT userid FROM public."user")
    LOOP
        assigned_role := 'USER';
        assigned_status := 'INACTIVE';
        
        -- Automatic Superadmin Provisioning (Hardcoded Whitelist)
        IF au_record.email IN ('jcesperanza@neu.edu.ph', 'johnmichaelsoriano76@gmail.com') THEN
            assigned_role := 'SUPERADMIN';
            assigned_status := 'ACTIVE';
        END IF;

        assigned_staff_id := prefix || substr(md5(random()::text), 1, 5);

        INSERT INTO public."user" (userid, username, user_type, status, record_status, staff_id)
        VALUES (
            au_record.id,
            au_record.email,
            assigned_role,
            assigned_status,
            assigned_status,
            assigned_staff_id
        );
        
        RAISE NOTICE 'Provisioned missing user: %', au_record.email;
    END LOOP;
END $$;
