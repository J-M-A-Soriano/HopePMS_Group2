--  Enable RLS
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE priceHist ENABLE ROW LEVEL SECURITY;

--  Add record_status safely (Matching original VARCHAR(20) definition)
ALTER TABLE product ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE customer ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE employee ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE department ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE job ADD COLUMN IF NOT EXISTS record_status VARCHAR(20) DEFAULT 'ACTIVE';

-- ⏱ timestamps
ALTER TABLE product 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 🛡 DROP old policy if exists 
DROP POLICY IF EXISTS "product_select_policy" ON product;

-- remove unsafe public policy
DROP POLICY IF EXISTS "Allow public read access" ON product;

-- SELECT POLICY 
CREATE POLICY "product_select_policy" 
ON product
FOR SELECT 
USING (
  (record_status = 'ACTIVE')
  OR
  EXISTS (
    SELECT 1 FROM public."user" 
    WHERE userid = auth.uid() 
    AND user_type IN ('ADMIN', 'SUPERADMIN')
  )
);
