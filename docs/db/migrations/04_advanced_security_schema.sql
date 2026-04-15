-- 1. Add new columns to the public.user table
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50);

-- Make the staff_id unique if it has data. 
-- For existing rows, let's auto-generate a fallback staff_id before enforcing uniqueness.
UPDATE "user" SET staff_id = 'HOPE-2026-' || substr(md5(random()::text), 1, 5) WHERE staff_id IS NULL;
ALTER TABLE "user" ADD CONSTRAINT unique_staff_id UNIQUE (staff_id);

-- Enforce status constraints
ALTER TABLE "user" ADD CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED'));

-- 2. Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_id UUID,
    staff_id_used VARCHAR(50) NOT NULL,
    metadata JSONB,
    FOREIGN KEY (performed_by) REFERENCES "user"(userid)
);

-- Note: A SuperAdmin or Admin needs access to read the audit logs.
-- Make sure to update RLS protocols if they are heavily enforced on this DB.
-- For standard demonstration:
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "user" 
            WHERE userid = auth.uid() 
            AND user_type IN ('ADMIN', 'SUPERADMIN') 
            AND status = 'ACTIVE'
        )
    );

CREATE POLICY "Anyone can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        auth.uid() = performed_by
    );
