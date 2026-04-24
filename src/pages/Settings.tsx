import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, KeyRound, Clock, CheckCircle } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';
import { fetchSystemConfig, updateSystemConfig } from '@/lib/api/config';

export function Settings() {
  const { canViewSystemConfig } = useUserRights();

  const [bizName, setBizName] = useState('Hope Pharmacy & Supplies');
  const [bizTin, setBizTin] = useState('000-111-222-000');
  const [lockout, setLockout] = useState('Disabled (24/7 Access)');
  const [blueprint, setBlueprint] = useState('HOPE-2026-');

  // UI Feedback Status state
  const [alert, setAlert] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      const dbConfig = await fetchSystemConfig();
      if (dbConfig) {
        setBizName(dbConfig.business_name);
        setBizTin(dbConfig.tax_id);
        setLockout(dbConfig.shift_lockout);
        setBlueprint(dbConfig.blueprint_prefix);
      }
      setLoading(false);
    };
    loadConfig();
  }, []);

  if (!canViewSystemConfig) {
    return <Navigate to="/" />;
  }

  const showFeedback = (message: string) => {
    setAlert({ message, type: 'success' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSaveIdentity = async () => {
    try {
      await updateSystemConfig({ business_name: bizName, tax_id: bizTin });
      showFeedback('Business Identity Variables perfectly synced to database.');
    } catch(e: any) {
      window.alert("Error: Database syncing failed. Are you Superadmin? " + e.message);
    }
  };

  const handleSaveLockout = async () => {
    try {
      await updateSystemConfig({ shift_lockout: lockout });
      showFeedback(`Operational rule enforced: ${lockout}`);
    } catch(e: any) {
      window.alert("Error: Database syncing failed. " + e.message);
    }
  };

  const handleSaveBlueprint = async () => {
    try {
      await updateSystemConfig({ blueprint_prefix: blueprint });
      showFeedback('Database generator prefix has been permanently shifted.');
    } catch(e: any) {
      window.alert("Error: Database syncing failed. " + e.message);
    }
  };

  if (loading) return <div className="p-8">Syncing Superadmin dashboard with database...</div>;

  return (
    <div className="p-8 pb-16 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" /> System Configuration
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Superadmin global operational parameters directly synced to Cloud.</p>
        </div>
      </div>

      {alert && (
         <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-md text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            {alert.message}
         </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4 border-b dark:border-slate-700 pb-3">
            <Store className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Business Identity</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Receipt Business Name</label>
              <input 
                type="text" 
                className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 outline-none focus:ring-indigo-500/20" 
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Identification Number (TIN)</label>
              <input 
                 type="text" 
                 className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 outline-none focus:ring-indigo-500/20" 
                 value={bizTin}
                 onChange={(e) => setBizTin(e.target.value)}
              />
            </div>
            <button onClick={handleSaveIdentity} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium px-4 py-2 rounded text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">Force Sync Identity</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-4 border-b dark:border-slate-700 pb-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Operational Enforcements</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Global Shift Lockout</label>
              <select 
                className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 outline-none focus:ring-orange-500/20"
                value={lockout}
                onChange={(e) => setLockout(e.target.value)}
              >
                <option value="Disabled (24/7 Access)">Disabled (24/7 Access)</option>
                <option value="Enforce Strict 9AM-5PM">Enforce Strict 9AM-5PM</option>
                <option value="Enforce Night Shift (8PM-4AM)">Enforce Night Shift (8PM-4AM)</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              When enabled, standard Cashiers and Staff will automatically face an Access Denied error if attempting to log in outside valid shift schedules.
            </p>
            <button onClick={handleSaveLockout} className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium px-4 py-2 rounded text-sm hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">Apply Lockout Rule</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm p-6 md:col-span-2 transition-colors">
          <div className="flex items-center gap-3 mb-4 border-b dark:border-slate-700 pb-3">
            <KeyRound className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Staff Credentials Blueprint</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Generation Prefix</label>
                  <input 
                    type="text" 
                    className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm uppercase focus:ring-2 outline-none focus:ring-red-500/20" 
                    value={blueprint}
                    onChange={(e) => setBlueprint(e.target.value)}
                  />
                </div>
                <button onClick={handleSaveBlueprint} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium px-4 py-2 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">Sync Update Blueprint</button>
             </div>
             <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded border dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">Notice</h3>
                Modifying the ID generation prefix overrides the internal Postgres trigger for all future user registrations. Your new string will exactly bypass the legacy HOPE-2026- template.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
