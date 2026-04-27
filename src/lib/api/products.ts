import { supabase } from '../supabase';
import { logAction } from './audit';

export type Product = {
  prodCode: string;
  description: string;
  unit: string;
  record_status?: string;
  created_at?: string;
  updated_at?: string;
  unitPrice?: number; // Injected dynamically at runtime
};

// Fetch active products
export const fetchProducts = async () => {
  const { data: prods, error } = await supabase
    .from('product')
    .select('*')
    .eq('record_status', 'ACTIVE')
    .order('prodcode', { ascending: true });

  if (error) {
    console.error('CRITICAL Error fetching products:', error);
    return [];
  }

  // Cross-reference pull the full price ledger to securely map latest price values
  const { data: prices, error: prErr } = await supabase.from('pricehist').select('*');
  const priceMap = new Map<string, number>();

  if (!prErr && prices) {
    // Sort chronologically ascending to ensure the latest records progressively overwrite the map
    prices.sort((a: any, b: any) => {
       const aDate = a.effDate || a.effdate;
       const bDate = b.effDate || b.effdate;
       return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
    
    prices.forEach((p: any) => {
       const code = p.prodCode || p.prodcode;
       const uPrice = p.unitPrice || p.unitprice;
       priceMap.set(code, uPrice);
    });
  }

  // Inject real time price values
  return prods.map((p: any) => {
     const code = p.prodCode || p.prodcode;
     return { 
       ...p, 
       prodCode: code,
       unitPrice: priceMap.get(code) || 0
     };
  }) as Product[];
};

// Add a new product pipeline
export const addProduct = async (product: Omit<Product, 'record_status' | 'created_at' | 'updated_at' | 'unitPrice'>, initialPrice: number = 0) => {
  // 1. Securely Insert Core Baseline
  const { data, error } = await supabase
    .from('product')
    .insert([{ prodCode: product.prodCode, description: product.description, unit: product.unit, record_status: 'ACTIVE' }])
    .select()
    .single();

  if (error) throw error;

  // 2. Transact Price Baseline asynchronously
  const { error: priceError } = await supabase.from('pricehist').insert([{
    effDate: new Date().toISOString().split('T')[0], // Automatically format YYYY-MM-DD
    prodCode: product.prodCode,
    unitPrice: initialPrice,
    record_status: 'ACTIVE'
  }]);

  if (priceError) {
    console.error("Failed to commit initial LEDGER baseline for pricing:", priceError);
  }

  return data;
};

// Update an existing product
export const updateProduct = async (
  prodCode: string, 
  description: string, 
  unit: string, 
  newPrice: number = 0,
  currentPrice: number = 0,
  staffId: string = '', 
  performedBy: string = ''
) => {
  const { data, error } = await supabase
    .from('product')
    .update({ description, unit, updated_at: new Date().toISOString() })
    .eq('prodcode', prodCode) // Defensively downcased
    .select()
    .single();

  if (error) throw error;
  
  // Ledger Integration: Intercept price changes mathematically
  if (Math.abs(newPrice - currentPrice) > 0.001) {
     const { error: priceError } = await supabase.from('pricehist').upsert([{
        effdate: new Date().toISOString().split('T')[0],
        prodcode: prodCode,
        unitprice: newPrice,
        record_status: 'ACTIVE'
     }], { onConflict: 'effdate, prodcode' });

     if (priceError) {
        console.error("Failed to commit Price Update Ledger Baseline:", priceError);
     } else if (performedBy) {
        // Log the severe price override independently
        await logAction('PRICE_OVERRIDE', prodCode, { oldPrice: currentPrice, newPrice, staff_id_used: staffId }, performedBy);
     }
  }
  
  if (performedBy) {
    await logAction('PRODUCT_UPDATE', prodCode, { staff_id_used: staffId }, performedBy);
  }
  
  return data;
};

// Soft delete product (set record_status to INACTIVE or DELETED)
export const softDeleteProduct = async (prodCode: string) => {
  const { error } = await supabase
    .from('product')
    .update({ record_status: 'INACTIVE', updated_at: new Date().toISOString() })
    .eq('prodcode', prodCode);

  if (error) throw error;
  return true;
};

// Price History types and fetches
export type PriceHistory = {
  effDate: string;
  prodCode: string;
  unitPrice: number;
  record_status: string;
};

export const fetchPriceHistory = async (prodCode: string) => {
  const { data, error } = await supabase
    .from('pricehist')
    .select('*')
    .eq('prodcode', prodCode)
    .order('effDate', { ascending: false });

  if (error) throw error;
  return data.map((p: any) => ({ ...p, prodCode: p.prodCode || p.prodcode })) as PriceHistory[];
};
