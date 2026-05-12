-- Migration 03: Enterprise Fields and Performance Indexing
-- Goal: Ensure all records contain created_at, updated_at, and relevant enterprise metadata.

-- 1. Ensure product table has all required fields
ALTER TABLE product 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- 2. Ensure user table has activity tracking
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- 3. Enhance Notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'System' CHECK (category IN ('Inventory', 'Security', 'System', 'Reports', 'User Management'));

-- 4. Price History Enhancements
ALTER TABLE pricehist 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS changed_by UUID REFERENCES "user"(userid),
ADD COLUMN IF NOT EXISTS old_price DECIMAL(10,2);

-- 5. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON product(created_at);
CREATE INDEX IF NOT EXISTS idx_pricehist_effdate ON pricehist(effdate DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_product') THEN
        CREATE TRIGGER set_updated_at_product BEFORE UPDATE ON product FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_user') THEN
        CREATE TRIGGER set_updated_at_user BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
