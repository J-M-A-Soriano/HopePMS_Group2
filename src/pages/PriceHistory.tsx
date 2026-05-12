import React, { useEffect, useState, useMemo } from 'react';
import { fetchPriceHistory } from '@/lib/api/products';
import type { PriceHistory as PH } from '@/lib/api/products';
import { ActionConfirmModal } from '@/components/ActionConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { Edit2, AlertCircle, CheckCircle, Search, TrendingUp, TrendingDown, Minus, History, Download } from 'lucide-react';
import { logAction } from '@/lib/api/audit';
import { DateRangePicker } from '@/components/DateRangePicker';
import { getLocalISODate } from '@/utils/dateUtils';

export function PriceHistory() {
  const [history, setHistory] = useState<PH[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ prodCode: string, unitPrice: number, effDate: string } | null>(null);
  
  const [feedback, setFeedback] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const showFeedback = (message: string, type: 'error' | 'success' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };
  
  const { user, staffId, userRole } = useAuth();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      let query = supabase
        .from('pricehist')
        .select('*')
        .order('effdate', { ascending: false });
      
      if (startDate) query = query.gte('effdate', startDate);
      if (endDate) query = query.lte('effdate', endDate);

      const { data, error } = await query.limit(500);
      
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
  }, [startDate, endDate]);

  const sortedAndFilteredHistory = useMemo(() => {
    // Sort by prodCode then date to find previous prices
    const sorted = [...history].sort((a, b) => {
      if (a.prodCode < b.prodCode) return -1;
      if (a.prodCode > b.prodCode) return 1;
      return new Date(b.effDate).getTime() - new Date(a.effDate).getTime();
    });

    const withDiff = sorted.map((h, i) => {
      const prev = sorted[i + 1];
      const sameProduct = prev && prev.prodCode === h.prodCode;
      const oldPrice = sameProduct ? prev.unitPrice : null;
      const diff = oldPrice ? h.unitPrice - oldPrice : 0;
      const pct = oldPrice ? (diff / oldPrice) * 100 : 0;
      
      return { ...h, oldPrice, diff, pct };
    });

    return withDiff.filter(h => 
      !search || h.prodCode.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.effDate).getTime() - new Date(a.effDate).getTime());
  }, [history, search]);

  const handleEditClick = (h: PH) => {
    setEditingPrice({ prodCode: h.prodCode, unitPrice: h.unitPrice, effDate: h.effDate });
    setModalOpen(true);
  };

  const executePriceUpdate = async () => {
    if (!editingPrice || !user) return;
    try {
      const newPriceStr = prompt(`Enter new price for ${editingPrice.prodCode}:`, editingPrice.unitPrice.toString());
      if (newPriceStr === null) return;
      
      const newPrice = parseFloat(newPriceStr);
      if (!isNaN(newPrice) && newPrice !== editingPrice.unitPrice) {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.from('pricehist')
            .update({ unitprice: newPrice })
            .eq('prodcode', editingPrice.prodCode)
            .eq('effdate', editingPrice.effDate);
        
        if (!error) {
           await logAction({
             actionType: 'PRICE_UPDATE',
             module: 'Inventory',
             status: 'Success',
             description: `Price adjusted for ${editingPrice.prodCode} from ₱${editingPrice.unitPrice} to ₱${newPrice}`,
             targetId: editingPrice.prodCode,
             oldValue: { unitPrice: editingPrice.unitPrice },
             newValue: { unitPrice: newPrice },
             performedBy: user.id,
             staffId: staffId
           });
           showFeedback("Price successfully updated.");
           loadHistory();
        } else {
           showFeedback("Update failed: " + error.message, 'error');
        }
      }
    } catch(e) { console.error(e); }
    setModalOpen(false);
    setEditingPrice(null);
  };

  const handleExport = () => {
    const headers = ['Effective Date', 'Product Code', 'Old Price', 'New Price', 'Difference', '% Change'];
    const rows = sortedAndFilteredHistory.map(h => [
      new Date(h.effDate).toLocaleDateString(),
      h.prodCode,
      h.oldPrice || 'N/A',
      h.unitPrice,
      h.diff.toFixed(2),
      h.pct.toFixed(2) + '%'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `price_history_${getLocalISODate()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <History className="w-6 h-6 text-white" />
            </div>
            Price Comparison Engine
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Track inflation, adjustments, and historical pricing trends.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onStartChange={setStartDate} 
            onEndChange={setEndDate}
            onClear={() => { setStartDate(''); setEndDate(''); }}
          />
          <button 
            onClick={handleExport}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4 text-indigo-500" /> Export
          </button>
        </div>
      </div>

      {feedback && (
         <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${feedback.type === 'error' ? 'bg-rose-50 border border-rose-100 text-rose-800' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
            {feedback.type === 'error' ? <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" /> : <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
            {feedback.message}
         </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Filter by product code..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm">
           <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
           <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Recalculating price differentials...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Effective Date</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest">Product Code</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-right">Previous Price</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-right">Updated Price</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Variance</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedAndFilteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-2 text-slate-400 opacity-40 italic">
                         <Minus className="w-10 h-10" />
                         <p>No price adjustments found for this period.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-slate-200 font-bold tracking-tight">
                          {new Date(h.effDate).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase mt-0.5">
                          {new Date(h.effDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{h.prodCode}</td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-slate-400 dark:text-slate-500 font-bold">
                           {h.oldPrice ? `₱${h.oldPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'First Entry'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-slate-900 dark:text-white font-black text-base">
                           ₱{h.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {h.oldPrice ? (
                           <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-tighter ${h.diff > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : h.diff < 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400'}`}>
                             {h.diff > 0 ? <TrendingUp className="w-3 h-3" /> : h.diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                             {h.diff > 0 ? '+' : ''}{h.diff.toFixed(2)} ({h.pct.toFixed(1)}%)
                           </div>
                         ) : (
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Baseline</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {userRole === 'ADMIN' && (
                           <button 
                             onClick={() => handleEditClick(h)}
                             className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-90"
                             title="Adjust Price"
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
        </div>
      )}

      <ActionConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onVerified={executePriceUpdate} 
        actionTitle={`Manual Price Adjustment: ${editingPrice?.prodCode}`}
      />
    </div>
  );
}
