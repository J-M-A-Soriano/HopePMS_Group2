import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Users, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/api/audit';
import { useAuth } from '@/context/AuthContext';

export function SecurityCenter() {
  const { user: currentUser } = useAuth();
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      // Fetch active users
      const { data: usersData } = await supabase
        .from('user')
        .select('*')
        .eq('record_status', 'ACTIVE')
        .order('username', { ascending: true });
        
      if (usersData) setActiveUsers(usersData);

      // Fetch recent global activity
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:public_user!audit_logs_performed_by_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (logsData) setRecentLogs(logsData);
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to instantly suspend ${username}? They will be logged out and unable to access the system.`)) return;

    try {
      const { error } = await supabase.from('user').update({ record_status: 'INACTIVE' }).eq('userid', userId);
      if (!error) {
         await logAction({
            actionType: 'EMERGENCY_SUSPEND',
            module: 'Security Logs',
            status: 'Warning',
            description: `Emergency suspension of user ${username} via Security Center`,
            targetId: userId,
            performedBy: currentUser?.id
         });
         setActiveUsers(activeUsers.filter(u => u.userid !== userId));
      }
    } catch (err) {
      console.error('Failed to suspend user:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-rose-500" /> Security Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Global security overview, access policies, and threat monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts & Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <Lock className="w-8 h-8 text-indigo-500 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Access Control</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Global system lockdown will forcefully terminate all sessions except Superadmins.</p>
            <button className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-800/50 text-sm font-bold rounded transition w-full uppercase tracking-wide">Initiate Global Lockdown</button>
          </div>

          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-6 shadow-sm">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-4" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Global Audit Feed</h2>
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
              {recentLogs.map(log => (
                <div key={log.id} className="text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{log.action_type}</p>
                  <p className="text-xs text-slate-500">{log.user?.username || 'Unknown'} - {new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Users / Sessions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" /> Active System Users
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage user access and terminate sessions instantly.</p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                 {activeUsers.length} Online
              </span>
            </div>
            
            <div className="p-0">
               {loading ? (
                 <div className="p-8 text-center text-slate-500">Scanning active sessions...</div>
               ) : (
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                      <tr>
                        <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">User</th>
                        <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Role</th>
                        <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 dark:divide-slate-700">
                      {activeUsers.map(u => (
                        <tr key={u.userid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                           <td className="p-4">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 font-bold uppercase text-xs">
                                 {u.username.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-medium text-slate-900 dark:text-white text-sm">{u.username}</p>
                                 <p className="text-xs text-slate-500">{u.staff_id || 'No Staff ID'}</p>
                               </div>
                             </div>
                           </td>
                           <td className="p-4">
                             <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 uppercase">{u.user_type}</span>
                           </td>
                           <td className="p-4 text-right">
                             {u.userid !== currentUser?.id && u.user_type !== 'SUPERADMIN' && (
                               <button 
                                 onClick={() => handleSuspendUser(u.userid, u.username)}
                                 className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-800/50 rounded text-xs font-bold transition"
                               >
                                 Kill Session
                               </button>
                             )}
                             {u.userid === currentUser?.id && <span className="text-xs text-slate-400 italic">You</span>}
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
    </div>
  );
}
