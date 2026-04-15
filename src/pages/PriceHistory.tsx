import React, { useEffect, useState } from 'react';
import { fetchPriceHistory } from '@/lib/api/products';
import type { PriceHistory as PH } from '@/lib/api/products';
import { ActionConfirmModal } from '@/components/ActionConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { Edit2 } from 'lucide-react';
import { logAction } from '@/lib/api/audit';

export function PriceHistory() {
  const [history, setHistory] = useState<PH[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ prodCode: string, unitPrice: number, effDate: string } | null>(null);
  
  const { user, staffId, userRole } = useAuth();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('pricehist')
        .select('*')
        .order('effdate', { ascending: false })
        .limit(50);
      
      if (!error && data) {
         const normalized = data.map((d: any) => ({
             effDate: d.effDate || d.effdate,
             prodCode: d.prodCode || d.prodcode,
             unitPrice: d.unitPrice || d.unitprice,
             record_status: d.record_status
         }));
         setHistory(normalized);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter(h => 
    h.prodCode && h.prodCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditClick = (h: PH) => {
    setEditingPrice({ prodCode: h.prodCode, unitPrice: h.unitPrice, effDate: h.effDate });
    setModalOpen(true);
  };

  const executePriceUpdate = async () => {
    if (!editingPrice || !user) return;
    try {
      const newPrice = parseFloat(prompt('Enter multiple for major price update:', editingPrice.unitPrice.toString()) || '0');
      if (newPrice && newPrice !== editingPrice.unitPrice) {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.from('pricehist')
            .update({ unitprice: newPrice })
            .eq('prodcode', editingPrice.prodCode)
            .eq('effdate', editingPrice.effDate);
        
        if (!error) {
           await logAction('PRICE_OVERRIDE', editingPrice.prodCode, { oldPrice: editingPrice.unitPrice, newPrice, staff_id_used: staffId }, user.id);
           loadHistory();
        } else {
           console.error("Update failed:", error);
           alert("Update failed API error: " + error.message);
        }
      }
    } catch(e) { console.error(e); }
    setModalOpen(false);
    setEditingPrice(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Price History</h1>
          <p className="text-slate-500">Track changes to product pricing over time.</p>
        </div>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Filter by Product Code..." 
          className="border rounded-md px-4 py-2 w-full max-w-sm outline-none focus:ring-2 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading history...</div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Effective Date</th>
                <th className="px-6 py-4 font-semibold text-slate-600 border-r border-slate-200">Product Code</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right w-32 border-r border-slate-200">Unit Price</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span>No history found.</span>
                      </div>
                   </td>
                 </tr>
              ) : (
                filteredHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900">{h.effDate ? new Date(h.effDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{h.prodCode}</td>
                    <td className="px-6 py-4 text-slate-600 text-right w-32 font-medium">${h.unitPrice ? h.unitPrice.toFixed(2) : '0.00'}</td>
                    <td className="px-6 py-4 text-center w-24">
                      {userRole === 'ADMIN' && (
                         <button 
                           onClick={() => handleEditClick(h)}
                           className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ActionConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onVerified={executePriceUpdate} 
        actionTitle={`Update Price for ${editingPrice?.prodCode}`}
      />
    </div>
  );
}
