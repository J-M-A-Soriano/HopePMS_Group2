import React, { useEffect, useState, useMemo } from 'react';
import { Bell, CheckCircle2, AlertCircle, ShieldAlert, Package, Settings, History, Info, Filter, Search } from 'lucide-react';
import { fetchNotifications, markAsRead, markAllAsRead, Notification } from '@/lib/api/notifications';
import { DateRangePicker } from '@/components/DateRangePicker';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Category filter
      if (categoryFilter !== 'All' && n.category !== categoryFilter) return false;
      
      // Date range filter
      if (startDate && new Date(n.created_at) < new Date(startDate)) return false;
      if (endDate && new Date(n.created_at) > new Date(endDate + 'T23:59:59')) return false;
      
      return true;
    });
  }, [notifications, categoryFilter, startDate, endDate]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Inventory': return <Package className="w-4 h-4 text-emerald-500" />;
      case 'Security': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'Reports': return <History className="w-4 h-4 text-indigo-500" />;
      case 'User Management': return <Settings className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-sky-500" />;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'High': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="relative p-2 bg-sky-500 rounded-xl shadow-lg shadow-sky-500/20">
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </div>
            Notification Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Global system alerts and prioritized event notifications.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onStartChange={setStartDate} 
            onEndChange={setEndDate}
            onClear={() => { setStartDate(''); setEndDate(''); }}
          />
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead} 
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-all uppercase tracking-widest whitespace-nowrap active:scale-95"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
           <Filter className="w-3.5 h-3.5 text-slate-400" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Category:</span>
           <div className="flex gap-1.5">
             {['All', 'Inventory', 'Security', 'System'].map(cat => (
               <button 
                 key={cat}
                 onClick={() => setCategoryFilter(cat)}
                 className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${categoryFilter === cat ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 {cat}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-3xl shadow-sm overflow-hidden transition-all">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Synchronizing alert feed...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-40" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Zero Alerts Detected</p>
              <p className="text-sm text-slate-400 mt-1">System status is optimal. No matching notifications.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
             {filteredNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-6 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/30 group ${n.is_read ? 'opacity-60 grayscale-[0.5]' : 'bg-white dark:bg-slate-800'}`}
                >
                   <div className="flex gap-5 flex-1 min-w-0">
                      <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${n.is_read ? 'bg-slate-100 dark:bg-slate-700' : 'bg-sky-100 dark:bg-sky-900/30'}`}>
                         {getCategoryIcon(n.category || 'System')}
                      </div>
                      <div className="min-w-0 space-y-1.5">
                         <div className="flex flex-wrap items-center gap-2">
                           <h3 className="font-black text-slate-800 dark:text-white truncate max-w-md tracking-tight leading-none">
                              {n.title}
                           </h3>
                           {n.priority && (
                             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getPriorityClass(n.priority)}`}>
                               {n.priority}
                             </span>
                           )}
                           {n.category && (
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border dark:border-slate-700">
                               {n.category}
                             </span>
                           )}
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                           {n.message}
                         </p>
                         <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-tight pt-1">
                           <span className="flex items-center gap-1"><History className="w-3 h-3" /> {new Date(n.created_at).toLocaleDateString()}</span>
                           <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                      </div>
                   </div>
                   {!n.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(n.id)} 
                        className="sm:opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-widest shrink-0 active:scale-95"
                      >
                        Acknowledge
                      </button>
                   )}
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
