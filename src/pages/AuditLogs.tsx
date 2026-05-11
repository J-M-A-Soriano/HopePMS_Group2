import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Search, Calendar, Filter, Download, FileText, AlertTriangle, X, Info, ShieldAlert, Monitor, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function AuditLogs() {
  const { canViewAdminLogs, canViewSystemConfig, isSuperadmin } = useUserRights();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Security
  if (!isSuperadmin && !canViewSystemConfig) {
    return <Navigate to="/" />;
  }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

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
    return logs.filter(log => {
      const meta = log.metadata || {};
      
      // Tab/Module filter
      if (activeTab !== 'All') {
        const moduleMatch = meta.module === activeTab || (activeTab === 'Authentication' && log.action_type.includes('LOGIN'));
        if (!moduleMatch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'All' && meta.status !== statusFilter) return false;
      
      // Date filter
      if (dateFilter && !log.created_at.startsWith(dateFilter)) return false;

      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          log.action_type?.toLowerCase().includes(searchLower) ||
          log.staff_id_used?.toLowerCase().includes(searchLower) ||
          meta.description?.toLowerCase().includes(searchLower) ||
          meta.user_name?.toLowerCase().includes(searchLower) ||
          log.target_id?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [logs, activeTab, statusFilter, dateFilter, searchTerm]);
  
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Analytics
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(l => new Date(l.created_at) >= todayStart);
  const failedCount = todayLogs.filter(l => l.metadata?.status === 'Failed').length;
  const warningCount = todayLogs.filter(l => l.metadata?.status === 'Warning').length;
  const uniqueUsersToday = new Set(todayLogs.map(l => l.performed_by)).size;

  // Chart Data (Last 7 days activity)
  const chartData = useMemo(() => {
    const days: any = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    logs.forEach(l => {
      const date = l.created_at.split('T')[0];
      if (days[date] !== undefined) days[date]++;
    });
    return Object.keys(days).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      events: days[date]
    }));
  }, [logs]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action Type', 'Module', 'Status', 'Target ID', 'Description'];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.created_at).toLocaleString().replace(',', ''),
      log.metadata?.user_name || log.staff_id_used || 'SYSTEM',
      log.metadata?.user_role || 'N/A',
      log.action_type,
      log.metadata?.module || 'N/A',
      log.metadata?.status || 'Info',
      log.target_id || 'N/A',
      `"${(log.metadata?.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `enterprise_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Success': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="w-3.5 h-3.5"/> Success</span>;
      case 'Failed': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50"><XCircle className="w-3.5 h-3.5"/> Failed</span>;
      case 'Warning': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50"><AlertTriangle className="w-3.5 h-3.5"/> Warning</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"><Info className="w-3.5 h-3.5"/> Info</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 pb-16 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" /> Enterprise Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor system integrity, security events, and user activities.</p>
        </div>
        {isSuperadmin && (
          <div className="flex gap-2">
             <button onClick={handleExportCSV} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                <FileText className="w-4 h-4 text-green-600" /> Excel/CSV
             </button>
             <button onClick={handlePrintPDF} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> PDF Report
             </button>
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:hidden">
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Activities Today</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{todayLogs.length}</h3>
         </div>
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Failed Actions</p>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">{failedCount}</h3>
         </div>
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Security Warnings</p>
            <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{warningCount}</h3>
         </div>
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Active Users Today</p>
            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{uniqueUsersToday}</h3>
         </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm p-5 mb-8 print:hidden h-64">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Activity Trend (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
            <Tooltip 
              cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Bar dataKey="events" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide print:hidden">
        {['All', 'Authentication', 'Products', 'Inventory', 'User Management', 'Archive/Vault'].map(tab => (
          <button 
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-md' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
          >
            {tab === 'All' ? 'All Activities' : tab}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {/* Table Toolbar */}
        <div className="p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 print:hidden">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, user, or target..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-colors"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
             <select 
                value={statusFilter} 
                onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none"
             >
                <option value="All">All Status</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
             </select>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {setDateFilter(e.target.value); setCurrentPage(1);}}
                  className="pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 outline-none"
                />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading enterprise audit trail...</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">User / Identity</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Action Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Target</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 print:hidden text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No logs found matching your strict criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const meta = log.metadata || {};
                    return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-slate-200 font-medium">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(meta.status || 'Info')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-medium">{meta.user_name || log.staff_id_used || 'SYSTEM'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-0.5 flex gap-2">
                           <span>{meta.user_role || 'Role: N/A'}</span>
                           {meta.ip_address && <span className="text-indigo-400" title={meta.device_info}>{meta.ip_address}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{log.action_type}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 max-w-[200px] truncate" title={meta.description}>
                          {meta.description || meta.module || 'System Action'}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 px-2 py-1 rounded">
                          {log.target_id ? log.target_id.substring(0,8) + '...' : 'Global'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right print:hidden">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        {!loading && (
          <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 print:hidden">
             <div className="text-sm text-slate-500 dark:text-slate-400">
               Showing {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} events
             </div>
             <div className="flex items-center gap-4">
                <div className="flex gap-1">
                   <button 
                     disabled={currentPage === 1} 
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                   >Prev</button>
                   <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {currentPage} / {totalPages || 1}
                   </span>
                   <button 
                     disabled={currentPage === totalPages || totalPages === 0} 
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                   >Next</button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
           <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b dark:border-slate-800">
                 <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                       Action Details
                       {getStatusBadge(selectedLog.metadata?.status || 'Info')}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">Log ID: {selectedLog.id}</p>
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                 {/* Top Context */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                       <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Actor Context</h3>
                       <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedLog.metadata?.user_name || selectedLog.staff_id_used || 'System'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedLog.metadata?.user_role || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Staff ID:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedLog.staff_id_used || 'UNKNOWN'}</span></div>
                       </div>
                    </div>
                    <div>
                       <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Event Context</h3>
                       <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500">Action:</span> <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedLog.action_type}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Module:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedLog.metadata?.module || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Timestamp:</span> <span className="font-mono text-slate-900 dark:text-white">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
                       </div>
                    </div>
                 </div>

                 {/* Network & Device Info */}
                 {(selectedLog.metadata?.ip_address || selectedLog.metadata?.device_info) && (
                 <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                       <Globe className="w-4 h-4 text-slate-400" /> Connection Security
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                       <div className="flex flex-col gap-1">
                          <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">IP Address</span>
                          <span className="font-mono text-slate-900 dark:text-white">{selectedLog.metadata?.ip_address || 'Unknown'}</span>
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="text-slate-500 text-xs uppercase font-bold tracking-wider flex items-center gap-1"><Monitor className="w-3 h-3"/> Device Fingerprint</span>
                          <span className="text-slate-900 dark:text-white truncate" title={selectedLog.metadata?.device_info}>{selectedLog.metadata?.device_info || 'Unknown Client'}</span>
                       </div>
                    </div>
                 </div>
                 )}

                 {/* Description */}
                 <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                       Event Description
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                       {selectedLog.metadata?.description || 'No detailed description provided for this event.'}
                    </p>
                 </div>

                 {/* Data Payload Difference */}
                 {(selectedLog.metadata?.old_value || selectedLog.metadata?.new_value) && (
                 <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2 border-b dark:border-slate-800 pb-2">
                       Data Payload Changes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedLog.metadata?.old_value && (
                       <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg overflow-hidden">
                          <div className="bg-red-100 dark:bg-red-900/30 px-3 py-2 text-xs font-bold text-red-800 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 uppercase tracking-wider">Previous State (Before)</div>
                          <pre className="p-3 text-[11px] overflow-x-auto text-red-900 dark:text-red-300 whitespace-pre-wrap break-all">
                             {JSON.stringify(selectedLog.metadata.old_value, null, 2)}
                          </pre>
                       </div>
                       )}
                       {selectedLog.metadata?.new_value && (
                       <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg overflow-hidden md:col-start-2">
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider">New State (After)</div>
                          <pre className="p-3 text-[11px] overflow-x-auto text-emerald-900 dark:text-emerald-300 whitespace-pre-wrap break-all">
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
