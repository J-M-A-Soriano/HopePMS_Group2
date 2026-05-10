import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Activity, Trash2, ShieldAlert, Download } from 'lucide-react';
import { ActionConfirmModal } from '@/components/ActionConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useUserRights } from '@/context/UserRightsContext';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ userId: string, newStatus: string } | null>(null);
  
  const { user: currentUser, staffId } = useAuth();
  const { isSuperadmin, canViewAdminLogs, canChangeRoles } = useUserRights();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('user').select('*').order('username', { ascending: true });
      if (!error && data) setUsers(data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
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
      }
    } catch(e) { console.error(e); }
  };

  const adminIds = users.filter(u => u.user_type === 'ADMIN' || u.user_type === 'SUPERADMIN').map(u => u.userid);

  const canManageUser = (targetType: string) => {
    if (targetType === 'SUPERADMIN') return false;
    if (targetType === 'ADMIN' && !isSuperadmin) return false;
    return true;
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    const headers = ['User ID', 'Username', 'Role', 'Status', 'Staff ID', 'Created At'];
    const rows = users.map(u => [
      u.userid,
      u.username,
      u.user_type,
      u.record_status,
      u.staff_id || '',
      u.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> Admin Operations
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage security clearances and audit critical events.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportCSV} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors border dark:border-slate-700 shadow-sm">
              <Download className="w-4 h-4" /> Export Users
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-x-auto w-full transition-colors">
        {loading ? (
          <div className="p-6 text-slate-500 dark:text-slate-400 text-center">Loading users...</div>
        ) : (
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
              {paginatedUsers.map(u => (
                <tr key={u.userid} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {u.username.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px]" title={u.username}>{u.username}</span>
                      {u.user_type === 'SUPERADMIN' && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded uppercase font-bold w-max mt-0.5">Super</span>}
                    </div>
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
        )}
        
        {!loading && (
          <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
             <div className="text-sm text-slate-500 dark:text-slate-400">
               Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} entries
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

      <ActionConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onVerified={handleApplyStatusChange} 
        actionTitle={pendingAction ? `Change user status to ${pendingAction.newStatus}` : ''}
      />
    </div>
  );
}
