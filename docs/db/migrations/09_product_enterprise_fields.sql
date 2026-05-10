-- 09_product_enterprise_fields.sql
-- Safely adds missing inventory and taxonomy fields to the product table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.product
ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold DECIMAL(10,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Uncategorized',
ADD COLUMN IF NOT EXISTS supplier VARCHAR(50) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS sku VARCHAR(30) UNIQUE,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- We force an update so existing products get the defaults immediately
UPDATE public.product 
SET stock_quantity = 0 
WHERE stock_quantity IS NULL;
