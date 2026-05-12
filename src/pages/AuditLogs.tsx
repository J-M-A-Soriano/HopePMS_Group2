import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Search, Download, FileText, AlertTriangle, X, Info, ShieldAlert, Monitor, Globe, CheckCircle2, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { DateRangePicker } from '@/components/DateRangePicker';

export function AuditLogs() {
  const { canViewAdminLogs, canViewSystemConfig, isSuperadmin } = useUserRights();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Security
  if (!isSuperadmin && !canViewSystemConfig && !canViewAdminLogs) {
    return <Navigate to="/" />;
  }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (!error && data) {
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    let result = logs.filter(log => {
      const meta = log.metadata || {};
      
      // Tab/Module filter
      if (activeTab !== 'All') {
        const moduleMatch = meta.module === activeTab || (activeTab === 'Authentication' && log.action_type.includes('LOGIN'));
        if (!moduleMatch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'All' && meta.status !== statusFilter) return false;
      
      // Date Range Filter
      if (startDate && new Date(log.created_at) < new Date(startDate)) return false;
      if (endDate && new Date(log.created_at) > new Date(endDate + 'T23:59:59')) return false;

      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          log.action_type?.toLowerCase().includes(searchLower) ||
          log.staff_id_used?.toLowerCase().includes(searchLower) ||
          meta.description?.toLowerCase().includes(searchLower) ||
          meta.user_name?.toLowerCase().includes(searchLower) ||
          log.target_id?.toLowerCase().includes(searchLower) ||
          log.id.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'user_name') {
        aVal = a.metadata?.user_name || a.staff_id_used;
        bVal = b.metadata?.user_name || b.staff_id_used;
      }
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [logs, activeTab, statusFilter, startDate, endDate, searchTerm, sortField, sortDir]);
  
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Analytics (using local time for "Today")
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayLogs = useMemo(() => 
    logs.filter(l => new Date(l.created_at) >= todayStart),
    [logs, todayStart]
  );
  
  const failedCount = todayLogs.filter(l => l.metadata?.status === 'Failed').length;
  const warningCount = todayLogs.filter(l => l.metadata?.status === 'Warning').length;
  const uniqueUsersToday = new Set(todayLogs.map(l => l.performed_by)).size;

  // Chart Data (Responsive to Date Filters)
  const chartData = useMemo(() => {
    const days: any = {};
    const labels: string[] = [];
    
    let start = new Date();
    let end = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      // Cap at 31 days for chart readability
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 31) {
        start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
      }
    } else {
      start.setDate(start.getDate() - 6);
    }

    // Generate date slots
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toLocaleDateString('en-CA');
      days[dateStr] = 0;
      labels.push(dateStr);
      current.setDate(current.getDate() + 1);
    }
    
    logs.forEach(l => {
      const localDate = new Date(l.created_at).toLocaleDateString('en-CA');
      if (days[localDate] !== undefined) {
        days[localDate]++;
      }
    });
    
    return labels.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      events: days[date]
    }));
  }, [logs, startDate, endDate]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action Type', 'Module', 'Status', 'Target ID', 'IP Address', 'Description'];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.created_at).toISOString(),
      log.metadata?.user_name || log.staff_id_used || 'SYSTEM',
      log.metadata?.user_role || 'N/A',
      log.action_type,
      log.metadata?.module || 'N/A',
      log.metadata?.status || 'Info',
      log.target_id || 'N/A',
      log.metadata?.ip_address || 'N/A',
      `"${(log.metadata?.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_trail_${startDate || 'all'}_to_${endDate || 'now'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Success': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="w-3 h-3"/> Success</span>;
      case 'Failed': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50"><XCircle className="w-3 h-3"/> Failed</span>;
      case 'Warning': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50"><AlertTriangle className="w-3 h-3"/> Warning</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"><Info className="w-3 h-3"/> Info</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            Enterprise Audit Trail
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time system integrity and security event monitoring.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onStartChange={setStartDate} 
            onEndChange={setEndDate}
            onClear={() => { setStartDate(''); setEndDate(''); }}
          />
          {isSuperadmin && (
             <button onClick={handleExportCSV} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95">
                <FileText className="w-4 h-4 text-emerald-500" /> Export Trail
             </button>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
         {[
           { label: 'Total Events Today', value: todayLogs.length, color: 'indigo' },
           { label: 'Security Failures', value: failedCount, color: 'rose' },
           { label: 'Threat Warnings', value: warningCount, color: 'amber' },
           { label: 'Active Actors', value: uniqueUsersToday, color: 'sky' }
         ].map((kpi, i) => (
           <div key={i} className="bg-white dark:bg-slate-800 border dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className={`text-3xl font-black text-${kpi.color === 'rose' ? 'rose-600' : kpi.color === 'amber' ? 'amber-600' : kpi.color === 'sky' ? 'sky-600' : 'slate-800'} dark:text-${kpi.color === 'rose' ? 'rose-400' : kpi.color === 'amber' ? 'amber-400' : kpi.color === 'sky' ? 'sky-400' : 'white'}`}>{kpi.value}</h3>
           </div>
         ))}
      </div>

      {/* Trend Analysis */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm p-6 print:hidden">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
          Velocity Analysis 
          {startDate && endDate ? ` (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})` : ' (7 Days)'}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderRadius: '12px', 
                  border: '1px solid hsl(var(--border))', 
                  color: 'hsl(var(--popover-foreground))',
                  padding: '10px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Bar dataKey="events" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#6366f1' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700/60 shadow-sm overflow-hidden transition-all">
        {/* Toolbar */}
        <div className="p-4 border-b dark:border-slate-700/60 flex flex-col xl:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 print:hidden">
          <div className="relative w-full xl:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Instant search by action, actor, target ID or log hash..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             <div className="flex gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-700/30 rounded-lg overflow-x-auto scrollbar-hide">
                {['All', 'Authentication', 'Products', 'Inventory', 'Security'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {tab}
                  </button>
                ))}
             </div>
             
             <select 
                value={statusFilter} 
                onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold px-3 py-2 text-slate-700 dark:text-slate-300 outline-none shadow-sm transition-all hover:border-slate-300"
             >
                <option value="All">All Status</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Warning">Warning</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
               <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Deciphering encrypted audit logs...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                <tr>
                  {[
                    { key: 'created_at', label: 'Timestamp' },
                    { key: 'status', label: 'Status' },
                    { key: 'user_name', label: 'Actor Identity' },
                    { key: 'action_type', label: 'Action Vector' },
                    { key: 'target_id', label: 'Object ID' },
                  ].map(col => (
                    <th 
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{col.label} <SortIcon field={col.key} /></div>
                    </th>
                  ))}
                  <th className="px-6 py-4 font-black text-slate-500 uppercase text-[10px] tracking-widest text-right">Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-2 text-slate-400 opacity-40 italic">
                         <ShieldAlert className="w-10 h-10" />
                         <p>No telemetry data matches your filter parameters.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const meta = log.metadata || {};
                    return (
                    <tr key={log.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-slate-200 font-bold tracking-tight">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(meta.status || 'Info')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-black">{meta.user_name || log.staff_id_used || 'SYSTEM'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 flex items-center gap-2">
                           <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{meta.user_role || 'N/A'}</span>
                           {meta.ip_address && <span className="text-indigo-500/60 font-mono tracking-tighter">{meta.ip_address}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 dark:text-slate-300 text-xs tracking-tight">{log.action_type}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px] truncate group-hover:max-w-none transition-all" title={meta.description}>
                          {meta.description || meta.module || 'System Event'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 px-2 py-1 rounded-lg">
                          {log.target_id ? log.target_id.substring(0,8) : 'ROOT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-xl text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && (
          <div className="p-4 border-t dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 print:hidden">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Index {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} Records
             </div>
             <div className="flex items-center gap-3">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                ><ArrowUp className="-rotate-90 w-4 h-4" /></button>
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                   {currentPage} / {totalPages || 1}
                </span>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                ><ArrowDown className="-rotate-90 w-4 h-4" /></button>
             </div>
          </div>
        )}
      </div>

      {/* Modal - Unchanged but styled slightly better in rewrite if needed, but keeping logic */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 print:hidden animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter">
                       Event Analytics
                       {getStatusBadge(selectedLog.metadata?.status || 'Info')}
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hash: {selectedLog.id}</p>
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl transition-all active:scale-90"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Actor Context</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Identity:</span> <span className="text-sm font-black text-slate-900 dark:text-white">{selectedLog.metadata?.user_name || selectedLog.staff_id_used || 'System'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Privilege:</span> <span className="text-xs font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">{selectedLog.metadata?.user_role || 'N/A'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Node ID:</span> <span className="text-xs font-mono font-bold text-slate-500">{selectedLog.staff_id_used || 'UNKNOWN'}</span></div>
                       </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Event Vector</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Type:</span> <span className="text-sm font-black text-slate-900 dark:text-white">{selectedLog.action_type}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Subsystem:</span> <span className="text-xs font-black text-slate-700 dark:text-slate-300">{selectedLog.metadata?.module || 'Global'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Epoch:</span> <span className="text-xs font-mono font-bold text-slate-500">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
                       </div>
                    </div>
                 </div>

                 {/* Network & Device Info */}
                 {(selectedLog.metadata?.ip_address || selectedLog.metadata?.device_info) && (
                 <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Globe className="w-3.5 h-3.5" /> Telemetry Fingerprint
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Source IP Address</span>
                          <p className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">{selectedLog.metadata?.ip_address || 'Unmasked'}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Client Agent Architecture</span>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={selectedLog.metadata?.device_info}>{selectedLog.metadata?.device_info || 'Native Environment'}</p>
                       </div>
                    </div>
                 </div>
                 )}

                 {/* Payload Diff */}
                 {(selectedLog.metadata?.old_value || selectedLog.metadata?.new_value) && (
                 <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="w-3.5 h-3.5" /> State Differential
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {selectedLog.metadata?.old_value && (
                       <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl overflow-hidden">
                          <div className="bg-rose-100/50 dark:bg-rose-900/30 px-4 py-2 text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest border-b border-rose-100/50 dark:border-rose-900/20">Previous State</div>
                          <pre className="p-4 text-[10px] font-mono leading-relaxed text-rose-900 dark:text-rose-300 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                             {JSON.stringify(selectedLog.metadata.old_value, null, 2)}
                          </pre>
                       </div>
                       )}
                       {selectedLog.metadata?.new_value && (
                       <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl overflow-hidden">
                          <div className="bg-emerald-100/50 dark:bg-emerald-900/30 px-4 py-2 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest border-b border-emerald-100/50 dark:border-emerald-900/20">New State</div>
                          <pre className="p-4 text-[10px] font-mono leading-relaxed text-emerald-900 dark:text-emerald-300 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                             {JSON.stringify(selectedLog.metadata.new_value, null, 2)}
                          </pre>
                       </div>
                       )}
                    </div>
                 </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
