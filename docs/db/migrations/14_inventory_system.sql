-- 14_inventory_system.sql
-- Adds stock_quantity to product and creates inventory_transactions

-- 1. Add stock_quantity to product table
ALTER TABLE public.product 
ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(10,2) DEFAULT 0.0 CONSTRAINT stock_qty_ck CHECK (stock_quantity >= 0.0);

-- 2. Create inventory_transactions table
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(6) NOT NULL REFERENCES public.product(prodCode) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CONSTRAINT inv_type_ck CHECK (transaction_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE')),
    quantity DECIMAL(10,2) NOT NULL,
    performed_by UUID NOT NULL REFERENCES public."user"(userid),
    reference_id UUID, -- Optional reference to stock_request or sales id
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can view all transactions
CREATE POLICY "Admins can view inventory transactions" ON public.inventory_transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public."user" WHERE userid = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN'))
    );

-- Admins can insert transactions
CREATE POLICY "Admins can insert inventory transactions" ON public.inventory_transactions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public."user" WHERE userid = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN'))
    );

-- 3. Trigger to update product stock_quantity automatically
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type IN ('STOCK_IN', 'ADJUSTMENT') THEN
        UPDATE public.product 
        SET stock_quantity = stock_quantity + NEW.quantity 
        WHERE prodCode = NEW.product_id;
    ELSIF NEW.transaction_type IN ('STOCK_OUT', 'SALE') THEN
        UPDATE public.product 
        SET stock_quantity = stock_quantity - NEW.quantity 
        WHERE prodCode = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_product_stock ON public.inventory_transactions;
CREATE TRIGGER trg_update_product_stock
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();
