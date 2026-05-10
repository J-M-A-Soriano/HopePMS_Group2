import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserRights } from '@/context/UserRightsContext';
import { Activity, Package, AlertCircle, Clock, ShieldCheck, ArrowRight, Layers, FileQuestion } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { user, userRole } = useAuth();
  const { canViewAdminPanel, isSuperadmin } = useUserRights();

  const [metrics, setMetrics] = useState({
    recentActivity: 0,
    activeInventory: 0,
    lowStock: 0,
    pendingRequests: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch basic counts
        const [activityRes, requestsRes, invRes, lowStockRes] = await Promise.all([
          supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('performed_by', user.id).gte('created_at', today.toISOString()),
          supabase.from('stock_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
          (canViewAdminPanel || isSuperadmin) ? supabase.from('product').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
          (canViewAdminPanel || isSuperadmin) ? supabase.from('product').select('*', { count: 'exact', head: true }).lt('stock_quantity', 10) : Promise.resolve({ count: 0 })
        ]);

        setMetrics({
          recentActivity: activityRes.count || 0,
          pendingRequests: requestsRes.count || 0,
          activeInventory: invRes.count || 0,
          lowStock: lowStockRes.count || 0,
        });

        // Fetch chart data (Last 7 days of activity)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const query = supabase.from('audit_logs').select('created_at');
        if (!isSuperadmin && !canViewAdminPanel) {
           query.eq('performed_by', user.id);
        }
        query.gte('created_at', sevenDaysAgo.toISOString());
        
        const { data: logsData } = await query;
        
        if (logsData) {
           // Aggregate by day
           const daysMap = new Map();
           for(let i=0; i<7; i++) {
              const d = new Date(sevenDaysAgo);
              d.setDate(d.getDate() + i);
              const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
              daysMap.set(dateStr, 0);
           }
           
           logsData.forEach(log => {
              const d = new Date(log.created_at);
              const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
              if (daysMap.has(dateStr)) {
                 daysMap.set(dateStr, daysMap.get(dateStr) + 1);
              }
           });
           
           setChartData(Array.from(daysMap, ([name, Actions]) => ({ name, Actions })));
        }

        // Fetch recent feed
        const feedQuery = supabase.from('audit_logs')
           .select('id, action_type, created_at, user:public_user!audit_logs_performed_by_fkey(username)')
           .order('created_at', { ascending: false })
           .limit(5);
           
        if (!isSuperadmin && !canViewAdminPanel) feedQuery.eq('performed_by', user.id);
        
        const { data: feedData } = await feedQuery;
        if (feedData) setRecentLogs(feedData);

      } catch (err) {
        console.error('Metrics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, canViewAdminPanel, isSuperadmin]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight">
            Welcome back, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isSuperadmin 
              ? "System Health and Global Security Overview" 
              : canViewAdminPanel 
                ? "Daily Operations and Inventory Pulse" 
                : "Your Personal Activity Dashboard"}
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
           Live Feed Active
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Recent Activity" 
          value={metrics.recentActivity} 
          subtitle="Actions taken today" 
          icon={Activity} 
          colorClass="text-indigo-600 dark:text-indigo-400" 
          gradientClass="bg-indigo-500" 
        />
        
        {(canViewAdminPanel || isSuperadmin) && (
          <MetricCard 
            title="Active Catalog" 
            value={metrics.activeInventory} 
            subtitle="Products in database" 
            icon={Package} 
            colorClass="text-emerald-600 dark:text-emerald-400" 
            gradientClass="bg-emerald-500" 
          />
        )}

        {(canViewAdminPanel || isSuperadmin) && (
          <MetricCard 
            title="Low Stock Alerts" 
            value={metrics.lowStock} 
            subtitle={metrics.lowStock > 0 ? "Requires immediate attention" : "All stock levels healthy"} 
            icon={AlertCircle} 
            colorClass={metrics.lowStock > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"} 
            gradientClass={metrics.lowStock > 0 ? "bg-rose-500" : "bg-emerald-500"} 
          />
        )}

        {(!canViewAdminPanel && !isSuperadmin) && (
          <MetricCard 
            title="Pending Requests" 
            value={metrics.pendingRequests} 
            subtitle="Awaiting admin approval" 
            icon={Clock} 
            colorClass="text-amber-600 dark:text-amber-400" 
            gradientClass="bg-amber-500" 
          />
        )}

        {isSuperadmin && (
          <MetricCard 
            title="Security Status" 
            value="Secure" 
            subtitle="No active threats detected" 
            icon={ShieldCheck} 
            colorClass="text-sky-600 dark:text-sky-400" 
            gradientClass="bg-sky-500" 
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
             <div>
               <h2 className="text-lg font-bold text-slate-800 dark:text-white">Activity Trend</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">System actions over the last 7 days</p>
             </div>
          </div>
          
          <div className="h-72 w-full relative z-10">
            {loading ? (
               <div className="w-full h-full flex items-center justify-center text-slate-400">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: 'none', color: '#fff' }}
                    itemStyle={{ color: '#818cf8' }}
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
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {canViewAdminPanel && (
                <Link to="/inventory" className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-900/50 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform"><Layers className="w-4 h-4" /></div>
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Manage Inventory</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </Link>
              )}
              <Link to={canViewAdminPanel ? "/stock-requests" : "/stock-requests"} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform"><FileQuestion className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                    {canViewAdminPanel ? "Review Requests" : "New Request"}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-slate-800 dark:text-white">Live Feed</h2>
               <Link to={canViewAdminPanel ? "/audit-logs" : "/activity"} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">View All</Link>
            </div>
            
            <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-2 space-y-5">
               {loading ? (
                 <div className="text-sm text-slate-400 pl-4">Loading feed...</div>
               ) : recentLogs.length === 0 ? (
                 <div className="text-sm text-slate-400 pl-4">No recent activity.</div>
               ) : (
                 recentLogs.map((log, i) => (
                   <div key={log.id} className="relative pl-5 group">
                     <div className={`absolute w-2.5 h-2.5 rounded-full -left-[6px] top-1.5 ring-4 ring-white dark:ring-slate-800 ${i === 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                     <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{log.action_type}</p>
                     <p className="text-xs text-slate-500 mt-0.5 font-medium">{log.user?.username || 'Unknown'} • {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                 ))
               )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
