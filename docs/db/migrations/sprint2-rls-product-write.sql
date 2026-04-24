-- RLS WRITE Policies for product table

-- Drop existing policies
DROP POLICY IF EXISTS "product_insert_policy" ON product;
DROP POLICY IF EXISTS "product_update_policy" ON product;
DROP POLICY IF EXISTS "product_soft_delete" ON product;
DROP POLICY IF EXISTS "product_recover" ON product;


CREATE POLICY "product_insert_policy"
ON product
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE userid = auth.uid() 
    AND user_type IN ('MANAGER', 'ADMIN', 'SUPERADMIN')
    AND record_status = 'ACTIVE'
  )
);


CREATE POLICY "product_update_policy"
ON product
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE userid = auth.uid() 
    AND user_type IN ('MANAGER', 'ADMIN', 'SUPERADMIN')
    AND record_status = 'ACTIVE'
  )
);


CREATE POLICY "product_soft_delete"
ON product
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE userid = auth.uid() 
    AND user_type IN ('MANAGER', 'ADMIN', 'SUPERADMIN')
    AND record_status = 'ACTIVE'
  )
);

CREATE POLICY "product_recover"
ON product
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."user" 
    WHERE userid = auth.uid() 
    AND user_type IN ('ADMIN', 'SUPERADMIN')
    AND record_status = 'ACTIVE'
  )
);

SELECT * FROM pg_policies WHERE tablename = 'product';

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'product';
