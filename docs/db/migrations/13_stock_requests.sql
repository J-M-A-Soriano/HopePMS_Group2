-- 13_stock_requests.sql
-- Creates the stock_requests table for users to request inventory changes

CREATE TABLE IF NOT EXISTS public.stock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."user"(userid) ON DELETE CASCADE,
    product_id VARCHAR(6) NOT NULL REFERENCES public.product(prodCode) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CONSTRAINT req_type_ck CHECK (request_type IN ('RESTOCK', 'TRANSFER', 'ADJUSTMENT')),
    quantity DECIMAL(10,2) NOT NULL CONSTRAINT req_qty_ck CHECK (quantity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CONSTRAINT req_status_ck CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.stock_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests, Admins can view all
CREATE POLICY "Users can view their own requests" ON public.stock_requests
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public."user" WHERE userid = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN'))
    );

-- Users can insert their own requests
CREATE POLICY "Users can insert their own requests" ON public.stock_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update status
CREATE POLICY "Admins can update requests" ON public.stock_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public."user" WHERE userid = auth.uid() AND user_type IN ('ADMIN', 'SUPERADMIN'))
    );
