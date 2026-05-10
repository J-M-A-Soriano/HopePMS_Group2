import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Search, Calendar, Filter, Download } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';

export function AuditLogs() {
  const { canViewAdminLogs, canViewSystemConfig } = useUserRights();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Superadmin check
  if (!canViewSystemConfig) {
    return <Navigate to="/" />;
  }

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

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

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action_type?.toLowerCase().includes(searchLower) ||
      log.staff_id_used?.toLowerCase().includes(searchLower) ||
      log.performed_by?.toLowerCase().includes(searchLower)
    );
  });
  
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action Type', 'Staff ID', 'Target ID', 'Metadata'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString().replace(',', ''),
      log.action_type,
      log.staff_id_used || 'SYSTEM',
      log.target_id || 'N/A',
      `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-4 md:p-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" /> Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Comprehensive system event tracking and monitoring.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportCSV} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors border dark:border-slate-700 shadow-sm">
              <Download className="w-4 h-4" /> Export Logs
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Action, Staff ID, or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Showing {filteredLogs.length} events</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading audit trail...</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Action Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Performed By (Staff ID)</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Target ID</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-medium">{log.staff_id_used || 'SYSTEM'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-0.5" title={log.performed_by}>
                          User ID: {log.performed_by ? log.performed_by.substring(0,8)+'...' : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {log.target_id || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {!loading && (
          <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
             <div className="text-sm text-slate-500 dark:text-slate-400">
               Showing {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <span className="text-sm text-slate-500 dark:text-slate-400">Rows per page:</span>
                   <select 
                      value={itemsPerPage} 
                      onChange={e => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm p-1 outline-none text-slate-700 dark:text-slate-300"
                   >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                   </select>
                </div>
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
    </div>
  );
}
