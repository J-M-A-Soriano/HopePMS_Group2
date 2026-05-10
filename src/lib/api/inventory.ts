import { supabase } from '../supabase';
import { logAction } from './audit';

export type StockRequest = {
  id: string;
  user_id: string;
  product_id: string;
  request_type: 'RESTOCK' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes: string;
  created_at: string;
  user?: { email: string; staff_id: string };
  product?: { description: string };
};

export type InventoryTransaction = {
  id: string;
  product_id: string;
  transaction_type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SALE';
  quantity: number;
  performed_by: string;
  notes: string;
  created_at: string;
  user?: { email: string };
  product?: { description: string };
};

export const fetchStockRequests = async () => {
  const { data, error } = await supabase
    .from('stock_requests')
    .select(`
      *,
      user:public_user(email, staff_id),
      product:product(description)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as StockRequest[];
};

export const submitStockRequest = async (productId: string, type: string, quantity: number, notes: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('stock_requests')
    .insert([{
      user_id: userData.user.id,
      product_id: productId,
      request_type: type,
      quantity,
      notes
    }])
    .select()
    .single();

  if (error) throw error;
  
  await logAction('STOCK_REQUEST_SUBMITTED', data.id, { product_id: productId, quantity }, userData.user.id);
  return data;
};

export const updateRequestStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED', adminId: string) => {
  const { data, error } = await supabase
    .from('stock_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;

  await logAction(`STOCK_REQUEST_${status}`, requestId, { request_id: requestId }, adminId);

  // If approved, create an inventory transaction to fulfill it
  if (status === 'APPROVED' && data) {
      await performInventoryTransaction(
        data.product_id, 
        data.request_type === 'RESTOCK' ? 'STOCK_IN' : 'ADJUSTMENT', 
        data.quantity, 
        adminId, 
        `Fulfillment of request ${requestId}`
      );
      
      // Notify the user
      await supabase.from('notifications').insert([{
        user_id: data.user_id,
        title: 'Request Approved',
        message: `Your request for ${data.quantity} units has been approved.`,
        type: 'SYSTEM'
      }]);
  } else if (status === 'REJECTED' && data) {
      // Notify the user
      await supabase.from('notifications').insert([{
        user_id: data.user_id,
        title: 'Request Rejected',
        message: `Your stock request was rejected by an administrator.`,
        type: 'SYSTEM'
      }]);
  }

  return data;
};

export const performInventoryTransaction = async (productId: string, type: string, quantity: number, adminId: string, notes: string) => {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert([{
      product_id: productId,
      transaction_type: type,
      quantity,
      performed_by: adminId,
      notes
    }])
    .select()
    .single();

  if (error) throw error;
  
  await logAction('INVENTORY_TRANSACTION', data.id, { product_id: productId, type, quantity }, adminId);
  return data;
};

export const fetchInventoryTransactions = async () => {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      user:public_user(email),
      product:product(description)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as InventoryTransaction[];
};
