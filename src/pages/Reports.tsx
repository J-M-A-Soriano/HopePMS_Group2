import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, Package, Hash, AlertCircle, Download, List, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { fetchProducts } from '@/lib/api/products';
import type { Product } from '@/lib/api/products';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

type TopSeller = {
  prodCode: string;
  total_qty: number;
  description: string;
};

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export function Reports() {
  const [activeTab, setActiveTab] = useState<'rep001' | 'rep002'>('rep001');

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

  // Load REP_002 top sellers
  const fetchTopSellers = async () => {
    setRep002Loading(true);
    setErrorMsg(null);
    try {
      const { data: salesData, error: salesError } = await supabase.from('salesdetail').select('prodcode, quantity');
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

  // REP_001 filter + sort
  const filteredProducts = useMemo(() => {
    let result = products.filter(p =>
      p.prodCode.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(prodSearch.toLowerCase()) ||
      (p.unit && p.unit.toLowerCase().includes(prodSearch.toLowerCase()))
    );
    result.sort((a, b) => {
      const aVal = a[prodSortField] ?? '';
      const bVal = b[prodSortField] ?? '';
      if (aVal < bVal) return prodSortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return prodSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [products, prodSearch, prodSortField, prodSortDir]);

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
    return prodSortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  // REP_001 CSV export
  const handleExportREP001 = () => {
    const headers = ['Product Code', 'Description', 'Unit', 'Current Price'];
    const rows = filteredProducts.map(p => [
      p.prodCode,
      `"${p.description}"`,
      p.unit,
      p.unitPrice || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `product_report_REP001_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // REP_002 CSV export
  const handleExportREP002 = () => {
    const headers = ['Product Code', 'Description', 'Total Units Sold'];
    const rows = topSellers.map(item => [
      item.prodCode,
      `"${item.description}"`,
      item.total_qty
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_REP002_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" /> Analytics &amp; Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Comprehensive overview of product performance and sales.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('rep001')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'rep001'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <List className="w-4 h-4" /> REP-001: Product List
        </button>
        <button
          onClick={() => setActiveTab('rep002')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'rep002'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> REP-002: Top Selling
        </button>
      </div>

      {/* REP_001: Product List Report */}
      {activeTab === 'rep001' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by code, description, or unit..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
            </div>
            <button onClick={handleExportREP001} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors border dark:border-slate-700 shadow-sm whitespace-nowrap">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
            {prodLoading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading product data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                    <tr>
                      <th
                        className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        onClick={() => handleProdSort('prodCode')}
                      >
                        <div className="flex items-center gap-1">Product Code <SortIcon field="prodCode" /></div>
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        onClick={() => handleProdSort('description')}
                      >
                        <div className="flex items-center gap-1">Description <SortIcon field="description" /></div>
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        onClick={() => handleProdSort('unit')}
                      >
                        <div className="flex items-center gap-1">Unit <SortIcon field="unit" /></div>
                      </th>
                      <th
                        className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        onClick={() => handleProdSort('unitPrice')}
                      >
                        <div className="flex items-center gap-1">Current Price <SortIcon field="unitPrice" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          No products match your filter.
                        </td>
                      </tr>
                    ) : filteredProducts.map(p => (
                      <tr key={p.prodCode} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white font-mono">{p.prodCode}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.description}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 uppercase text-xs">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{p.unit}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          ${p.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!prodLoading && (
              <div className="px-6 py-3 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredProducts.length} of {products.length} active products
              </div>
            )}
          </div>
        </div>
      )}

      {/* REP_002: Top Selling */}
      {activeTab === 'rep002' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button onClick={handleExportREP002} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors border dark:border-slate-700 shadow-sm">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button onClick={fetchTopSellers} className="px-4 py-2 border dark:border-slate-700 dark:text-white rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Refresh Data
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {errorMsg}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Units Sold</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {rep002Loading ? '-' : totalUnits.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Top Product</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
                  {rep002Loading ? '-' : (topSellers.length > 0 ? topSellers[0].description : 'N/A')}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400">
                <Hash className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Unique Products Sold</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {rep002Loading ? '-' : uniqueProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Bar Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm p-6 lg:col-span-2 transition-colors">
              <h2 className="text-lg font-semibold mb-6 text-slate-800 dark:text-white">Top 10 Selling Products</h2>
              {rep002Loading ? (
                 <div className="h-[380px] flex items-center justify-center text-slate-400">Loading chart data...</div>
              ) : top10.length === 0 ? (
                 <div className="h-[380px] flex items-center justify-center text-slate-400">No sales data available.</div>
              ) : (
                 <div className="h-[380px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={top10} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                       <XAxis dataKey="prodCode" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                       <RechartsTooltip 
                         cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                         contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                       />
                       <Bar dataKey="total_qty" name="Units Sold" radius={[4, 4, 0, 0]}>
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
            <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm p-6 transition-colors">
              <h2 className="text-lg font-semibold mb-6 text-slate-800 dark:text-white">Volume Distribution</h2>
              {rep002Loading ? (
                 <div className="h-[380px] flex items-center justify-center text-slate-400">Loading chart data...</div>
              ) : pieData.length === 0 ? (
                 <div className="h-[380px] flex items-center justify-center text-slate-400">No sales data available.</div>
              ) : (
                 <div className="h-[380px] pb-4">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         cx="50%"
                         cy="45%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                         ))}
                       </Pie>
                       <RechartsTooltip 
                         contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                       />
                       <Legend verticalAlign="bottom" height={80} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }}/>
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
              )}
            </div>
          </div>

          {/* Ranked list table */}
          {!rep002Loading && top10.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Ranked Product List</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 w-12">Rank</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Product Code</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                      <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Total Qty Sold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {top10.map((item, idx) => (
                      <tr key={item.prodCode} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-900 dark:text-white font-medium">{item.prodCode}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{item.description}</td>
                        <td className="px-6 py-3 text-right font-semibold text-slate-800 dark:text-white">{item.total_qty.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
