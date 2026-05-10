-- Migration: 06_system_configuration
-- Purpose: Create a dynamically synchronized configuration table for System Settings.

CREATE TABLE IF NOT EXISTS public.system_config (
    id INT PRIMARY KEY DEFAULT 1,
    business_name VARCHAR(255) NOT NULL DEFAULT 'Hope Pharmacy & Supplies',
    tax_id VARCHAR(50) NOT NULL DEFAULT '000-111-222-000',
    shift_lockout VARCHAR(100) NOT NULL DEFAULT 'Disabled (24/7 Access)',
    blueprint_prefix VARCHAR(50) NOT NULL DEFAULT 'HOPE-2026-',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Ensure the row exists
INSERT INTO public.system_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Allow EVERYONE (even anon/non-admin) to READ the config. 
-- Standard users may need to read shift_lockout to know if they can login!
CREATE POLICY "Anyone can view system config" ON public.system_config
    FOR SELECT USING (true);

-- Allow ONLY SUPERADMIN to UPDATE the config
CREATE POLICY "Superadmins can update config" ON public.system_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public."user" 
            WHERE userid = auth.uid() 
            AND user_type = 'SUPERADMIN' 
            AND status = 'ACTIVE'
            AND record_status = 'ACTIVE'
        )
    );
