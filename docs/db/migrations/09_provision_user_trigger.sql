-- M4 (Rights & Auth Specialist)
-- This trigger automatically creates a user row in public."user"
-- when a new user signs up via Supabase Auth.
-- The user is created as USER / INACTIVE by default (Login Guard).

CREATE OR REPLACE FUNCTION public.provision_new_user()
RETURNS TRIGGER AS $$
  DECLARE
    assigned_role VARCHAR(20) := 'USER';
    assigned_status VARCHAR(20) := 'INACTIVE';
    assigned_staff_id VARCHAR(50);
    prefix VARCHAR(50);
  BEGIN
    -- Automatic Superadmin Provisioning (Hardcoded Whitelist)
    IF NEW.email IN ('jcesperanza@neu.edu.ph', 'johnmichaelsoriano76@gmail.com') THEN
      assigned_role := 'SUPERADMIN';
      assigned_status := 'ACTIVE';
    END IF;

    -- Dynamically pull the live ID Generation prefix from the Database config
    -- If the config table is empty or missing, fallback to HOPE-2026-
    -- We use exception handling in case system_config table doesn't exist yet
    BEGIN
      SELECT blueprint_prefix INTO prefix FROM public.system_config WHERE id = 1;
    EXCEPTION WHEN undefined_table THEN
      prefix := NULL;
    END;

    IF prefix IS NULL THEN
      prefix := 'HOPE-2026-';
    END IF;

    -- Generate secure internal ID
    assigned_staff_id := prefix || substr(md5(random()::text), 1, 5);

    -- Insert into public."user" (Quoted properly)
    -- We set BOTH status and record_status to ensure login guards work properly
    INSERT INTO public."user" (userid, username, user_type, status, record_status, staff_id)
    VALUES (
      NEW.id,
      NEW.email,
      assigned_role,
      assigned_status,
      assigned_status,
      assigned_staff_id
    );
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists so we don't get an error when re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.provision_new_user();
