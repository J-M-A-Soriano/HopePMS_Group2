import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Activity, Trash2, ShieldAlert } from 'lucide-react';
import { ActionConfirmModal } from '@/components/ActionConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useUserRights } from '@/context/UserRightsContext';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ userId: string, newStatus: string } | null>(null);
  
  const { user: currentUser, staffId } = useAuth();
  const { canSuspendAdmin, canViewAdminLogs, canChangeRoles } = useUserRights();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('user').select('*').order('created_at', { ascending: false });
      if (!error && data) setUsers(data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) {
        setAuditLogs(data);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const triggerStatusChange = (userId: string, newStatus: string) => {
    setPendingAction({ userId, newStatus });
    setModalOpen(true);
  };

  const handleApplyStatusChange = async () => {
    if (!pendingAction || !currentUser) return;
    try {
      const { userId, newStatus } = pendingAction;
      
      const { error } = await supabase.from('user').update({ record_status: newStatus }).eq('userid', userId);
      
      if (!error) {
        // Record Audit Log
        await supabase.from('audit_logs').insert([{
          performed_by: currentUser.id,
          action_type: `USER_${newStatus}`,
          target_id: userId,
          staff_id_used: staffId || 'UNKNOWN',
          metadata: { newStatus }
        }]);

        await fetchUsers();
        await fetchAuditLogs();
      }
    } catch(e) { console.error(e); }
    setModalOpen(false);
    setPendingAction(null);
  };

  const handleApplyRoleChange = async (userId: string, newRole: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('user').update({ user_type: newRole }).eq('userid', userId);
      
      if (!error) {
        // Record Audit Log
        await supabase.from('audit_logs').insert([{
          performed_by: currentUser.id,
          action_type: `ROLE_CHANGED_TO_${newRole}`,
          target_id: userId,
          staff_id_used: staffId || 'UNKNOWN',
          metadata: { newRole }
        }]);

        await fetchUsers();
        await fetchAuditLogs();
      }
    } catch(e) { console.error(e); }
  };

  const adminIds = users.filter(u => u.user_type === 'ADMIN' || u.user_type === 'SUPERADMIN').map(u => u.userid);
  const filteredAuditLogs = auditLogs.filter(log => {
      if (canViewAdminLogs) return true;
      return !adminIds.includes(log.performed_by);
  });

  const canManageUser = (targetType: string) => {
    if (targetType === 'SUPERADMIN') return false;
    if (targetType === 'ADMIN' && !canSuspendAdmin) return false;
    return true;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> Admin Operations
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage security clearances and audit critical events.</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-4 border-b border-slate-200 dark:border-slate-700">
         <button onClick={() => setActiveTab('staff')} className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'staff' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Staff Console</button>
         <button onClick={() => setActiveTab('audit')} className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'audit' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>Activity Feed</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {loading && activeTab === 'staff' ? (
          <div className="p-6 text-slate-500 dark:text-slate-400 text-center">Loading users...</div>
        ) : activeTab === 'staff' ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Username</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Staff ID</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Kill Switch</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {users.map(u => (
                <tr key={u.userid} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {u.username}
                    {u.user_type === 'SUPERADMIN' && <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded uppercase font-bold">Super</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 uppercase text-xs">{u.staff_id || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {canChangeRoles && u.user_type !== 'SUPERADMIN' ? (
                      <select 
                        value={u.user_type || 'USER'}
                        onChange={(e) => handleApplyRoleChange(u.userid, e.target.value)}
                        className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                      >
                        <option value="USER">User</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className="text-xs font-medium uppercase">{u.user_type || 'USER'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium uppercase ${u.record_status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {u.record_status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManageUser(u.user_type) ? (
                      u.record_status === 'ACTIVE' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => triggerStatusChange(u.userid, 'SUSPENDED')} className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/40 transition font-medium">
                             Suspend
                          </button>
                          <button onClick={() => triggerStatusChange(u.userid, 'TERMINATED')} className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1 rounded transition font-medium">
                             Terminate
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => triggerStatusChange(u.userid, 'ACTIVE')} className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition font-medium">
                           Restore Active
                        </button>
                      )
                    ) : (
                      <span className="text-slate-400 text-sm italic">Oversight Required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 h-[500px] overflow-y-auto space-y-4">
             {filteredAuditLogs.length === 0 ? <p className="text-slate-500 dark:text-slate-400">No events logged yet.</p> : filteredAuditLogs.map(log => (
               <div key={log.id} className="flex gap-4 p-4 border dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 items-start">
                  <Activity className="w-5 h-5 text-indigo-500 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{log.action_type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Performed by: {log.staff_id_used}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <ActionConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onVerified={handleApplyStatusChange} 
        actionTitle={pendingAction ? `Change user status to ${pendingAction.newStatus}` : ''}
      />
    </div>
  );
}
