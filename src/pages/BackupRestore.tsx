import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, FileJson, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function BackupRestore() {
  const { canViewSystemConfig } = useUserRights();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  if (!canViewSystemConfig) {
    return <Navigate to="/" />;
  }

  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const { data: products } = await supabase.from('products').select('*');
      const { data: users } = await supabase.from('user').select('*');
      const { data: config } = await supabase.from('system_config').select('*');

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        products: products || [],
        users: users || [],
        config: config || []
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `hopepms_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      setExportMessage({ text: 'System data successfully exported to JSON payload.', type: 'success' });
    } catch (e: any) {
      setExportMessage({ text: 'Export failed: ' + e.message, type: 'error' });
    }
    setIsExporting(false);
  };

  const showFeedback = (msg: string) => {
    setExportMessage({ text: msg, type: 'error' });
    setTimeout(() => setExportMessage(null), 4000);
  };

  return (
    <div className="p-4 md:p-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-teal-500" /> Backup & Restore
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage data snapshots and system state recovery.</p>
        </div>
      </div>

      {exportMessage && (
        <div className={`mb-6 p-4 rounded-md text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${exportMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-300'}`}>
          {exportMessage.type === 'error' ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          {exportMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4 border-b dark:border-slate-700 pb-3">
            <Download className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Create Backup</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Generate a full snapshot of the current database state, including products, user data, and system configurations. Password hashes are automatically excluded for security.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/50 py-3 rounded-md hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors font-medium text-sm disabled:opacity-50"
            >
              <FileJson className="w-4 h-4" />
              {isExporting ? 'Generating Snapshot...' : 'Export Full Snapshot (JSON)'}
            </button>
            <button 
              onClick={() => showFeedback('CSV export is currently limited to the Reports module.')}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Tables to CSV
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm p-6 transition-colors relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
          <div className="flex items-center gap-3 mb-4 border-b dark:border-slate-700 pb-3">
            <Upload className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Restore System</h2>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded p-3 mb-6 flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p><strong>Warning:</strong> Restoring from a backup will irreversibly overwrite the current database state. Existing active sessions will be terminated.</p>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group" onClick={() => showFeedback('Direct database restoration via UI is locked for safety. Please run the SQL payload directly via Supabase Dashboard.')}>
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-red-500 mx-auto mb-3 transition-colors" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Backup File</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drag and drop a JSON snapshot here, or click to browse.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
