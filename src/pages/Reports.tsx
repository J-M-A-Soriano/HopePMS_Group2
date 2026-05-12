import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, Package, Hash, AlertCircle, Download, List, Search, ArrowUp, ArrowDown, ArrowUpDown, Calendar } from 'lucide-react';
import { fetchProducts } from '@/lib/api/products';
import type { Product } from '@/lib/api/products';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { getLocalISODate } from '@/utils/dateUtils';

type TopSeller = {
  prodCode: string;
  total_qty: number;
  description: string;
  revenue?: number;
};

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6'];

export function Reports() {
  const [activeTab, setActiveTab] = useState<'rep001' | 'rep002'>('rep001');

  // Common Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // REP_001 State
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodSearch, setProdSearch] = useState('');
  const [prodSortField, setProdSortField] = useState<keyof Product>('prodCode');
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('asc');

  // REP_002 State
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [rep002Loading, setRep002Loading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalUnits, setTotalUnits] = useState(0);
  const [uniqueProducts, setUniqueProducts] = useState(0);

  // Load REP_001 products
  const loadProducts = async () => {
    setProdLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e: any) {
      console.error('REP_001 load error:', e);
    } finally {
      setProdLoading(false);
    }
  };

  const [prevTotalUnits, setPrevTotalUnits] = useState(0);

  // Load REP_002 top sellers with date filtering and trend analysis
  const fetchTopSellers = async () => {
    setRep002Loading(true);
    setErrorMsg(null);
    try {
      // 1. Current Period
      let salesQuery = supabase.from('salesdetail').select('prodcode, quantity, transno, sales!inner(salesdate)');
      
      if (startDate) salesQuery = salesQuery.gte('sales.salesdate', startDate);
      if (endDate) salesQuery = salesQuery.lte('sales.salesdate', endDate);

      const { data: salesData, error: salesError } = await salesQuery;
      
      // 2. Previous Period (for trend)
      let prevTotal = 0;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = end.getTime() - start.getTime();
        const prevStart = getLocalISODate(new Date(start.getTime() - duration - 86400000));
        const prevEnd = getLocalISODate(new Date(start.getTime() - 86400000));

        const { data: prevSales } = await supabase.from('salesdetail')
          .select('quantity, sales!inner(salesdate)')
          .gte('sales.salesdate', prevStart)
          .lte('sales.salesdate', prevEnd);
        
        if (prevSales) {
          prevTotal = prevSales.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
        }
      }
      setPrevTotalUnits(prevTotal);

      const { data: productData, error: productError } = await supabase.from('product').select('prodcode, description');

      if (salesError) throw new Error(salesError.message);
      if (productError) throw new Error(productError.message);

      if (salesData && productData) {
        const aggregated: Record<string, number> = {};
        let total = 0;

        for (const sale of salesData as any[]) {
          const code = sale.prodcode || sale.prodCode;
          const qty = Number(sale.quantity || 0);
          aggregated[code] = (aggregated[code] || 0) + qty;
          total += qty;
        }

        const productMap: Record<string, string> = {};
        for (const p of productData as any[]) {
            const code = p.prodcode || p.prodCode;
            productMap[code] = p.description || 'Unknown Product';
        }

        const sorted = Object.entries(aggregated)
          .map(([prodCode, total_qty]) => ({ 
            prodCode, 
            total_qty, 
            description: productMap[prodCode] || `Unknown (${prodCode})` 
          }))
          .sort((a, b) => b.total_qty - a.total_qty);

        setTotalUnits(total);
        setUniqueProducts(sorted.length);
        setTopSellers(sorted);
      }
    } catch (e: any) {
      console.error("Report generation error:", e);
      setErrorMsg(e.message || "Failed to load report data.");
    } finally {
      setRep002Loading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    fetchTopSellers();
  }, []);

  useEffect(() => {
    if (activeTab === 'rep002') fetchTopSellers();
  }, [startDate, endDate]);

  // REP_001 filter + sort
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.prodCode.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(prodSearch.toLowerCase()) ||
        (p.unit && p.unit.toLowerCase().includes(prodSearch.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Date filtering for products (created_at)
      // Date filtering for products (created_at) - using local day match
      if (startDate && p.created_at && getLocalISODate(new Date(p.created_at)) < startDate) return false;
      if (endDate && p.created_at && getLocalISODate(new Date(p.created_at)) > endDate) return false;

      return true;
    });

    result.sort((a: any, b: any) => {
      const aVal = a[prodSortField] ?? '';
      const bVal = b[prodSortField] ?? '';
      if (aVal < bVal) return prodSortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return prodSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [products, prodSearch, prodSortField, prodSortDir, startDate, endDate]);

  const handleProdSort = (field: keyof Product) => {
    if (prodSortField === field) {
      setProdSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setProdSortField(field);
      setProdSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof Product }) => {
    if (prodSortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return prodSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />;
  };

  const handleExportREP001 = () => {
    const headers = ['Product Code', 'Description', 'Unit', 'Price', 'Created At', 'Updated At'];
    const rows = filteredProducts.map(p => [
      p.prodCode,
      `"${p.description}"`,
      p.unit,
      p.unitPrice || 0,
      p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A',
      p.updated_at ? new Date(p.updated_at).toLocaleString() : 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_${startDate || 'all'}_to_${endDate || 'now'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportREP002 = () => {
    const headers = ['Rank', 'Product Code', 'Description', 'Total Units Sold'];
    const rows = topSellers.map((item, idx) => [
      idx + 1,
      item.prodCode,
      `"${item.description}"`,
      item.total_qty
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `top_selling_${startDate || 'all'}_to_${endDate || 'now'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const top10 = topSellers.slice(0, 10);
  const pieData = topSellers.slice(0, 5).map(item => ({ name: item.description, value: item.total_qty }));
  const othersQty = topSellers.slice(5).reduce((acc, curr) => acc + curr.total_qty, 0);
  if (othersQty > 0) {
    pieData.push({ name: 'Others', value: othersQty });
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Intelligence Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Enterprise-level data visualization and performance analytics.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onStartChange={setStartDate} 
            onEndChange={setEndDate}
            onClear={() => { setStartDate(''); setEndDate(''); }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200/60 dark:border-slate-700/50 shadow-inner">
        <button
          onClick={() => setActiveTab('rep001')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'rep001'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" /> Inventory Ledger
        </button>
        <button
          onClick={() => setActiveTab('rep002')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'rep002'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Sales Performance
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* REP-001: Inventory Ledger */}
        {activeTab === 'rep001' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700/60 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger by code or description..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                />
              </div>
              <button 
                onClick={handleExportREP001} 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm overflow-hidden transition-all">
              {prodLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Synchronizing inventory data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                      <tr>
                        {[
                          { key: 'prodCode', label: 'Code' },
                          { key: 'description', label: 'Description' },
                          { key: 'unit', label: 'Unit' },
                          { key: 'unitPrice', label: 'Price' },
                          { key: 'created_at', label: 'Created' },
                          { key: 'updated_at', label: 'Last Update' }
                        ].map((col) => (
                          <th
                            key={col.key}
                            className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => handleProdSort(col.key as any)}
                          >
                            <div className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                              {col.label} <SortIcon field={col.key as any} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <Search className="w-10 h-10 opacity-20" />
                              <p className="font-medium italic">No ledger entries match your criteria.</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredProducts.map(p => (
                        <tr key={p.prodCode} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group">
                          <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{p.prodCode}</td>
                          <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{p.description}</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 border dark:border-slate-600">
                              {p.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                            ₱{p.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                              {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!prodLoading && (
                <div className="px-6 py-4 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">End of Ledger</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {filteredProducts.length} entries filtered
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REP-002: Sales Performance */}
        {activeTab === 'rep002' && (
          <div className="space-y-8">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Cumulative Units', value: totalUnits, icon: Package, color: 'indigo', 
                  trend: prevTotalUnits > 0 ? ((totalUnits - prevTotalUnits) / prevTotalUnits * 100).toFixed(1) : null },
                { label: 'Market Leader', value: topSellers[0]?.description || 'N/A', icon: TrendingUp, color: 'emerald' },
                { label: 'Portfolio Width', value: uniqueProducts, icon: Hash, color: 'amber' }
              ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700/60 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                  <div className={`bg-${kpi.color}-500/10 dark:bg-${kpi.color}-500/20 p-4 rounded-2xl text-${kpi.color}-600 dark:text-${kpi.color}-400 group-hover:scale-110 transition-transform`}>
                    <kpi.icon className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                      {kpi.trend !== undefined && kpi.trend !== null && (
                        <div className={`flex items-center gap-0.5 text-[9px] font-black ${Number(kpi.trend) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {Number(kpi.trend) >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {Math.abs(Number(kpi.trend))}%
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-black text-slate-800 dark:text-white truncate">
                      {rep002Loading ? '...' : (kpi.label === 'Gross Revenue' ? '₱' : '') + (typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Bar Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Volume Ranking (Top 10)</h2>
                  <button onClick={fetchTopSellers} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <History className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                {rep002Loading ? (
                   <div className="h-[380px] flex items-center justify-center text-slate-400">Computing analytics...</div>
                ) : (
                   <div className="h-[380px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={top10} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                         <XAxis dataKey="prodCode" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                         <RechartsTooltip 
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              borderRadius: '12px', 
                              border: '1px solid hsl(var(--border))', 
                              color: 'hsl(var(--popover-foreground))', 
                              padding: '10px', 
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                            }}
                            itemStyle={{ color: 'hsl(var(--primary))', fontSize: '12px', fontWeight: 800 }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                          />
                         <Bar dataKey="total_qty" name="Units" radius={[6, 6, 0, 0]} barSize={40}>
                           {top10.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                )}
              </div>

              {/* Distribution Pie Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-8">Share of Voice</h2>
                {rep002Loading ? (
                   <div className="h-[380px] flex items-center justify-center text-slate-400">Allocating segments...</div>
                ) : (
                   <div className="h-[380px] flex flex-col items-center">
                     <ResponsiveContainer width="100%" height={260}>
                       <PieChart>
                         <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={70}
                           outerRadius={95}
                           paddingAngle={4}
                           dataKey="value"
                           stroke="none"
                         >
                           {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              borderRadius: '12px', 
                              border: '1px solid hsl(var(--border))', 
                              color: 'hsl(var(--popover-foreground))', 
                              padding: '10px', 
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                            }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="mt-4 w-full space-y-2 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2 truncate pr-4">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                              <span className="font-bold text-slate-600 dark:text-slate-300 truncate">{d.name}</span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white shrink-0">
                              {((d.value / totalUnits) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                     </div>
                   </div>
                )}
              </div>
            </div>

            {/* Detailed Rank Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b dark:border-slate-700/60 flex items-center justify-between">
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white">Performance Hierarchy</h2>
                 <button 
                  onClick={handleExportREP002}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 hover:underline"
                 >
                   <Download className="w-3.5 h-3.5" /> Full Performance CSV
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                     <tr>
                       <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest w-20">Rank</th>
                       <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Identifier</th>
                       <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Product Entity</th>
                       <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Volume</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {top10.map((item, idx) => (
                       <tr key={item.prodCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                         <td className="px-6 py-4">
                           <div className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs ${idx === 0 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : idx === 1 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                             #{idx + 1}
                           </div>
                         </td>
                         <td className="px-6 py-4 font-mono text-[13px] font-bold text-slate-800 dark:text-white tracking-tighter">{item.prodCode}</td>
                         <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.description}</td>
                         <td className="px-6 py-4 text-right">
                           <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full text-xs">
                             {item.total_qty.toLocaleString()}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-400 animate-in shake duration-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
