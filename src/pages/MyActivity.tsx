import React, { useEffect, useState } from 'react';
import { Activity, Calendar, Clock } from 'lucide-react';
import { fetchMyActivity, AuditLog } from '@/lib/api/audit';

export function MyActivity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const data = await fetchMyActivity();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    };
    loadActivity();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading activity...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-fuchsia-500" /> My Activity
          </h1>
          <p className="text-slate-500 dark:text-slate-400">A log of your recent actions and transactions within the system.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm p-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 md:ml-4 space-y-8">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute w-3 h-3 bg-fuchsia-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white dark:ring-slate-800"></div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{log.action_type}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" /> 
                  {new Date(log.created_at).toLocaleString()}
                </p>
                {log.metadata && (
                  <pre className="mt-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
