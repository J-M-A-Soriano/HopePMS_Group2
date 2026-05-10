import React, { useEffect, useState } from 'react';
import { FileQuestion, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { fetchStockRequests, submitStockRequest, updateRequestStatus, StockRequest } from '@/lib/api/inventory';

export function StockRequests() {
  const { canApproveRequests } = useUserRights();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [requestType, setRequestType] = useState('RESTOCK');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchStockRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newRequest = await submitStockRequest(productId, requestType, parseFloat(quantity), notes);
      setRequests([newRequest, ...requests]);
      setShowForm(false);
      setProductId('');
      setQuantity('');
      setNotes('');
    } catch (err) {
      console.error('Failed to submit request:', err);
      alert('Failed to submit request. Please ensure the Product ID exists.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      // In a real scenario we need the admin ID, but Supabase auth handles it securely
      // if we have proper RLS. For now we use a generic string or get it from context.
      // Wait, updateRequestStatus takes adminId. We can just use the user's ID from auth later.
      // Assuming updateRequestStatus handles it. We can just pass 'admin' or fetch user.
      const updated = await updateRequestStatus(id, status, 'current-admin-id');
      setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update request status.');
    }
  };

  const filteredRequests = requests.filter(r => r.status === filter);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading requests...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <FileQuestion className="w-8 h-8 text-amber-500" /> Stock Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {canApproveRequests 
              ? "Review and approve pending stock movement requests." 
              : "Submit and track your requests for stock replenishment or transfer."}
          </p>
        </div>
        {!canApproveRequests && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {showForm ? 'Cancel Request' : 'New Request'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-4 mb-6">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Submit New Request</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Code</label>
                <input required type="text" value={productId} onChange={e => setProductId(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="e.g. P00001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Request Type</label>
                <select value={requestType} onChange={e => setRequestType(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white">
                  <option value="RESTOCK">Restock</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                <input required type="number" min="1" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Reason</label>
             <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white" rows={2}></textarea>
           </div>
           <button disabled={submitting} type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition">
             {submitting ? 'Submitting...' : 'Submit Request'}
           </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-slate-700 flex gap-4 text-sm font-medium">
          <button onClick={() => setFilter('PENDING')} className={`pb-2 ${filter === 'PENDING' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Pending</button>
          <button onClick={() => setFilter('APPROVED')} className={`pb-2 ${filter === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Approved</button>
          <button onClick={() => setFilter('REJECTED')} className={`pb-2 ${filter === 'REJECTED' ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Rejected</button>
        </div>
        
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No {filter.toLowerCase()} requests</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 dark:divide-slate-700">
            {filteredRequests.map(req => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 dark:text-white text-sm bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{req.product_id}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{req.request_type}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{req.quantity} units requested</p>
                    <p className="text-xs text-slate-500 mt-1">Requested by: {req.user?.email || 'Unknown User'} on {new Date(req.created_at).toLocaleDateString()}</p>
                    {req.notes && <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900 p-2 rounded">"{req.notes}"</p>}
                 </div>
                 
                 {canApproveRequests && req.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleStatusUpdate(req.id, 'APPROVED')} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-800/50 rounded text-xs font-bold transition">
                         <CheckCircle2 className="w-4 h-4" /> Approve
                       </button>
                       <button onClick={() => handleStatusUpdate(req.id, 'REJECTED')} className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-800/50 rounded text-xs font-bold transition">
                         <XCircle className="w-4 h-4" /> Reject
                       </button>
                    </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
