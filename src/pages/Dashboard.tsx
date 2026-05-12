import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserRights } from '@/context/UserRightsContext';
import { Activity, Package, AlertCircle, Clock, ShieldCheck, ArrowRight, Layers, FileQuestion, TrendingUp, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PeriodSelector, DashboardPeriod } from '@/components/PeriodSelector';
import { DateRangePicker } from '@/components/DateRangePicker';

export function Dashboard() {
  const { user, userRole } = useAuth();
  const { canViewAdminPanel, isSuperadmin } = useUserRights();

  const [period, setPeriod] = useState<DashboardPeriod>('7d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  const [metrics, setMetrics] = useState({
    recentActivity: 0,
    activeInventory: 0,
    lowStock: 0,
    pendingRequests: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get date range based on period
  const getDateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case '24h':
        start.setHours(now.getHours() - 24);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (customRange.start) start.setTime(new Date(customRange.start).getTime());
        if (customRange.end) now.setTime(new Date(customRange.end).getTime() + 86399999); // End of day
        break;
    }
    return { start, end: now };
  }, [period, customRange]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { start, end } = getDateRange;

        // 1. Fetch Metrics
        const [activityRes, requestsRes, invRes, lowStockRes] = await Promise.all([
          supabase.from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .filter('performed_by', (isSuperadmin || canViewAdminPanel) ? 'neq' : 'eq', (isSuperadmin || canViewAdminPanel) ? '00000000-0000-0000-0000-000000000000' : user.id),
          supabase.from('stock_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
          (canViewAdminPanel || isSuperadmin) ? supabase.from('product').select('*', { count: 'exact', head: true }).eq('record_status', 'ACTIVE') : Promise.resolve({ count: 0 }),
          (canViewAdminPanel || isSuperadmin) ? supabase.from('product').select('*').eq('record_status', 'ACTIVE').lt('stock_quantity', 10) : Promise.resolve({ data: [], count: 0 })
        ]);

        setMetrics({
          recentActivity: activityRes.count || 0,
          pendingRequests: requestsRes.count || 0,
          activeInventory: invRes.count || 0,
          lowStock: lowStockRes.count || 0,
        });

        if (lowStockRes.data) {
           setLowStockItems(lowStockRes.data);
        }

        // 2. Fetch Chart Data (Dynamic Grouping)
        const chartQuery = supabase.from('audit_logs')
          .select('created_at')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        if (!isSuperadmin && !canViewAdminPanel) {
          chartQuery.eq('performed_by', user.id);
        }
        
        const { data: logsData } = await chartQuery;
        
        if (logsData) {
          const groupingMap = new Map();
          const diffMs = end.getTime() - start.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          // Logic for grouping: hourly for 24h, daily for others
          let formatOptions: Intl.DateTimeFormatOptions;
          let stepMs: number;

          if (diffDays <= 1.1) {
            formatOptions = { hour: '2-digit', hour12: true };
            stepMs = 3600000; // 1 hour
          } else if (diffDays <= 60) {
            formatOptions = { month: 'short', day: 'numeric' };
            stepMs = 86400000; // 1 day
          } else {
            formatOptions = { year: 'numeric', month: 'short' };
            stepMs = 86400000 * 30; // ~1 month
          }

          // Initialize intervals
          let current = new Date(start);
          while (current <= end) {
            const label = current.toLocaleString('en-US', formatOptions);
            groupingMap.set(label, 0);
            current = new Date(current.getTime() + stepMs);
          }

          logsData.forEach(log => {
            const d = new Date(log.created_at);
            const label = d.toLocaleString('en-US', formatOptions);
            if (groupingMap.has(label)) {
              groupingMap.set(label, groupingMap.get(label) + 1);
            }
          });

          setChartData(Array.from(groupingMap, ([name, Actions]) => ({ name, Actions })));
        }

        // 3. Fetch Recent Feed (Enriched)
        const feedQuery = supabase.from('audit_logs')
           .select('id, action_type, created_at, metadata, user:public_user!audit_logs_performed_by_fkey(username)')
           .order('created_at', { ascending: false })
           .limit(8);
           
        if (!isSuperadmin && !canViewAdminPanel) feedQuery.eq('performed_by', user.id);
        
        const { data: feedData } = await feedQuery;
        if (feedData) setRecentLogs(feedData);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, canViewAdminPanel, isSuperadmin, getDateRange]);

  const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass, gradientClass }: any) => (
    <div className={`relative overflow-hidden border dark:border-slate-700/60 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white dark:bg-slate-800`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${gradientClass} blur-2xl`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            {loading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-700 h-8 w-16 block rounded"></span> : value}
          </h3>
          <p className={`text-xs mt-2 font-medium ${colorClass}`}>{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${gradientClass} bg-opacity-20 backdrop-blur-sm shadow-inner`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight">
            Welcome back, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isSuperadmin 
              ? "Global Enterprise Monitoring & Security" 
              : canViewAdminPanel 
                ? "Warehouse Operations & Performance Pulse" 
                : "Your Activity & Status Overview"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {period === 'custom' && (
            <DateRangePicker 
              startDate={customRange.start} 
              endDate={customRange.end}
              onStartChange={(d) => setCustomRange(prev => ({ ...prev, start: d }))}
              onEndChange={(d) => setCustomRange(prev => ({ ...prev, end: d }))}
              onClear={() => setCustomRange({ start: '', end: '' })}
            />
          )}
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Activity Log" 
          value={metrics.recentActivity} 
          subtitle={`Actions in ${period === 'custom' ? 'range' : period === '24h' ? '24h' : period === '7d' ? '7 days' : 'period'}`} 
          icon={Activity} 
          colorClass="text-indigo-600 dark:text-indigo-400" 
          gradientClass="bg-indigo-500" 
        />
        
        {(canViewAdminPanel || isSuperadmin) && (
          <MetricCard 
            title="Active Inventory" 
            value={metrics.activeInventory} 
            subtitle="Products in system" 
            icon={Package} 
            colorClass="text-emerald-600 dark:text-emerald-400" 
            gradientClass="bg-emerald-500" 
          />
        )}

        {(canViewAdminPanel || isSuperadmin) && (
          <MetricCard 
            title="Low Stock Alerts" 
            value={metrics.lowStock} 
            subtitle={metrics.lowStock > 0 ? "Requires replenishment" : "Stock levels optimal"} 
            icon={AlertCircle} 
            colorClass={metrics.lowStock > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"} 
            gradientClass={metrics.lowStock > 0 ? "bg-rose-500" : "bg-emerald-500"} 
          />
        )}

        {(!canViewAdminPanel && !isSuperadmin) && (
          <MetricCard 
            title="Pending Requests" 
            value={metrics.pendingRequests} 
            subtitle="Awaiting approval" 
            icon={Clock} 
            colorClass="text-amber-600 dark:text-amber-400" 
            gradientClass="bg-amber-500" 
          />
        )}

        {isSuperadmin && (
          <MetricCard 
            title="System Security" 
            value="Encrypted" 
            subtitle="Zero incidents detected" 
            icon={ShieldCheck} 
            colorClass="text-sky-600 dark:text-sky-400" 
            gradientClass="bg-sky-500" 
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
             <div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-indigo-500" /> Activity Analytics
               </h2>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Trend analysis for the selected period</p>
             </div>
             <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">
               <TrendingUp className="w-3 h-3" /> Real-time
             </div>
          </div>
          
          <div className="flex-1 min-h-[320px] w-full relative z-10">
            {loading ? (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                 <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                 <span className="text-sm font-medium">Aggregating historical data...</span>
               </div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                No activity data found for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))', 
                      color: 'hsl(var(--popover-foreground))', 
                      padding: '10px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                    labelStyle={{ marginBottom: '4px', color: 'hsl(var(--muted-foreground))', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="Actions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActions)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Sidebar Feed & Actions */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Command Center</h2>
            <div className="space-y-3">
              {canViewAdminPanel && (
                <Link to="/inventory" className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-900/50 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform"><Layers className="w-4 h-4" /></div>
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Inventory Ledger</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </Link>
              )}
              <Link to="/stock-requests" className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform"><FileQuestion className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                    {canViewAdminPanel ? "Pending Approvals" : "Submit Request"}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </Link>
              <Link to="/audit-logs" className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg group-hover:scale-110 transition-transform"><History className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Security Archive</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-2xl shadow-sm p-6 flex flex-col max-h-[450px]">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Activity className="w-5 h-5 text-indigo-500" /> Operational Feed
               </h2>
               <Link to={canViewAdminPanel ? "/audit-logs" : "/activity"} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider">Historical Logs</Link>
            </div>
            
            <div className="relative border-l-2 border-slate-100 dark:border-slate-700/50 ml-2 space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {loading ? (
                 <div className="space-y-4 pl-4">
                   {[1,2,3].map(i => (
                     <div key={i} className="animate-pulse space-y-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3"></div>
                        <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded w-1/2"></div>
                     </div>
                   ))}
                 </div>
               ) : recentLogs.length === 0 ? (
                 <div className="text-sm text-slate-400 pl-4 italic">System idle. No recent actions.</div>
               ) : (
                 recentLogs.map((log, i) => (
                   <div key={log.id} className="relative pl-6 group">
                     <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-4 ring-white dark:ring-slate-800 transition-all ${i === 0 ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                     <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{log.action_type}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.metadata?.user_name || log.user?.username || 'System'}</span>
                          {log.metadata?.description ? ` • ${log.metadata.description}` : ` performed an action in ${log.metadata?.module || 'System'}`}
                        </p>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Advanced Low Stock Intelligence */}
      {(canViewAdminPanel || isSuperadmin) && lowStockItems.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-rose-900 dark:text-rose-100">Critical Stock Intelligence</h2>
                  <p className="text-sm text-rose-600 dark:text-rose-400">Inventory levels below threshold requiring immediate fulfillment</p>
                </div>
              </div>
              <Link to="/inventory" className="text-sm font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-2">
                Restock Now <ArrowRight className="w-4 h-4" />
              </Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {lowStockItems.slice(0, 6).map(item => (
               <div key={item.prodCode} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                 <div className="flex justify-between items-start mb-3">
                   <div className="font-mono text-xs font-bold text-slate-500 group-hover:text-rose-500 transition-colors">{item.prodCode}</div>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded text-[10px] font-bold">
                     {item.stock_quantity} {item.unit} left
                   </div>
                 </div>
                 <p className="text-sm font-bold text-slate-800 dark:text-white truncate mb-4">{item.description}</p>
                 <div className="flex items-center justify-between border-t border-rose-50 dark:border-rose-900/20 pt-3">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Status: <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-tight">Depleted</span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      Threshold: {item.low_stock_threshold || 10}
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
