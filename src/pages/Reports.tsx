import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, Package, Hash, AlertCircle } from 'lucide-react';
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
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // KPIs
  const [totalUnits, setTotalUnits] = useState(0);
  const [uniqueProducts, setUniqueProducts] = useState(0);

  const fetchTopSellers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch all sales details. Note: In Postgres, columns might be lowercase.
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSellers();
  }, []);

  const top10 = topSellers.slice(0, 10);
  const pieData = topSellers.slice(0, 5).map(item => ({ name: item.description, value: item.total_qty }));
  const othersQty = topSellers.slice(5).reduce((acc, curr) => acc + curr.total_qty, 0);
  if (othersQty > 0) {
    pieData.push({ name: 'Others', value: othersQty });
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" /> Analytics & Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Comprehensive overview of product performance and sales.</p>
        </div>
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
              {loading ? '-' : totalUnits.toLocaleString()}
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
              {loading ? '-' : (topSellers.length > 0 ? topSellers[0].description : 'N/A')}
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
              {loading ? '-' : uniqueProducts}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm p-6 lg:col-span-2 transition-colors">
          <h2 className="text-lg font-semibold mb-6 text-slate-800 dark:text-white">Top 10 Selling Products</h2>
          {loading ? (
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
          {loading ? (
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
    </div>
  );
}
