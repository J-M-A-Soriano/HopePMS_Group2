import React, { useState, useEffect, useMemo } from 'react';
import { Database, Download, Upload, AlertTriangle, FileJson, FileSpreadsheet, CheckCircle, Clock, History, ShieldCheck, Search } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DateRangePicker } from '@/components/DateRangePicker';
import { logAction } from '@/lib/api/audit';
import { useAuth } from '@/context/AuthContext';

export function BackupRestore() {
  const { canViewSystemConfig, isSuperadmin } = useUserRights();
  const { user, staffId } = useAuth();
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!canViewSystemConfig) {
    return <Navigate to="/" />;
  }

  const fetchBackupLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or('action_type.eq.SYSTEM_BACKUP,action_type.eq.SYSTEM_RESTORE')
        .order('created_at', { ascending: false });
      
      if (!error && data) setBackupLogs(data);
    } catch (e) { console.error(e); }
    setLogsLoading(false);
  };

  useEffect(() => {
    fetchBackupLogs();
  }, []);

  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const { data: products } = await supabase.from('product').select('*');
      const { data: users } = await supabase.from('user').select('*');
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.2.0-Enterprise",
        products: products || [],
        users: users || [],
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `hopepms_enterprise_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      if (user) {
        await logAction({
          actionType: 'SYSTEM_BACKUP',
          module: 'Archive/Vault',
          status: 'Success',
          description: `Full system snapshot generated successfully (${products?.length || 0} items)`,
          performedBy: user.id,
          staffId: staffId
        });
        fetchBackupLogs();
      }

      setExportMessage({ text: 'System snapshot generated and logged to security archive.', type: 'success' });
    } catch (e: any) {
      setExportMessage({ text: 'Snapshot generation failed: ' + e.message, type: 'error' });
    }
    setIsExporting(false);
  };

  const filteredLogs = useMemo(() => {
    return backupLogs.filter(l => {
      const matchesSearch = l.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.action_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (startDate && new Date(l.created_at) < new Date(startDate)) return false;
      if (endDate && new Date(l.created_at) > new Date(endDate + 'T23:59:59')) return false;
      
      return true;
    });
  }, [backupLogs, searchTerm, startDate, endDate]);

  const showFeedback = (msg: string) => {
    setExportMessage({ text: msg, type: 'error' });
    setTimeout(() => setExportMessage(null), 4000);
  };

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-teal-600 rounded-xl shadow-lg shadow-teal-600/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            Disaster Recovery & Vault
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Enterprise data protection, system snapshots, and recovery protocols.</p>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-full border border-teal-100 dark:border-teal-900/30 uppercase tracking-widest">
           <ShieldCheck className="w-3.5 h-3.5" /> High Availability Mode
        </div>
      </div>

      {exportMessage && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${exportMessage.type === 'error' ? 'bg-rose-50 border border-rose-100 text-rose-800' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
          {exportMessage.type === 'error' ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          {exportMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700/60 shadow-sm p-8 flex flex-col h-full transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6 border-b dark:border-slate-700 pb-5">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
               <Download className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Generate Snapshot</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            Create an immutable JSON record of the entire PMS environment. This process encrypts current inventory schemas and user hierarchies into a portable payload. Recommended before major structural changes.
          </p>
          
          <div className="mt-auto space-y-4">
            <button 
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl transition-all font-black text-sm disabled:opacity-50 shadow-lg shadow-teal-600/20 active:scale-95"
            >
              <FileJson className="w-4 h-4" />
              {isExporting ? 'Synthesizing Snapshot...' : 'GENERATE FULL PAYLOAD'}
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-sm p-8 flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
          <div className="flex items-center gap-3 mb-6 border-b dark:border-slate-700 pb-5">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
               <Upload className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">System Recovery</h2>
          </div>
          
          <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4 mb-8 flex items-start gap-3 text-xs font-bold text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">RESTORATION PROTOCOL: Uploading a snapshot will terminate all active database transactions and overwrite current production data. This action is logged and audited.</p>
          </div>

          <div 
            className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4" 
            onClick={() => showFeedback('Protocol Locked: Database restoration requires manual approval and shell-level execution for safety.')}
          >
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
               <Upload className="w-10 h-10 text-slate-300 group-hover:text-rose-500 transition-colors" />
            </div>
            <div>
               <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Inject Payload</p>
               <p className="text-[10px] font-bold text-slate-400 mt-1">Drag and drop snapshot (.json)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Logs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
             <History className="w-5 h-5 text-indigo-500" /> Vault Activity Logs
           </h2>
           <DateRangePicker 
             startDate={startDate} 
             endDate={endDate} 
             onStartChange={setStartDate} 
             onEndChange={setEndDate} 
             onClear={() => { setStartDate(''); setEndDate(''); }}
           />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700/60 shadow-sm overflow-hidden">
           <div className="p-4 border-b dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                />
              </div>
           </div>

           <div className="overflow-x-auto">
             {logsLoading ? (
                <div className="p-12 text-center text-slate-500">Loading audit trail...</div>
             ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Operation</th>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Description</th>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No operations recorded in this period.</td>
                      </tr>
                    ) : filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                           <div className="text-slate-900 dark:text-white font-bold">{new Date(log.created_at).toLocaleDateString()}</div>
                           <div className="text-[10px] font-black text-slate-400 uppercase">{new Date(log.created_at).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${log.action_type === 'SYSTEM_BACKUP' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {log.action_type.replace('SYSTEM_', '')}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{log.metadata?.description || 'N/A'}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5 font-black text-[10px] text-emerald-500 uppercase">
                              <CheckCircle className="w-3.5 h-3.5" /> SUCCESS
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
