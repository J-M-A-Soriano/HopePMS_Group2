import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { logAction } from '@/lib/api/audit';
import { ActionConfirmModal } from '@/components/ActionConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useUserRights } from '@/context/UserRightsContext';

export function Archive() {
  const [terminatedUsers, setTerminatedUsers] = useState<any[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'USER' | 'PRODUCT', id: string, isPurge?: boolean } | null>(null);
  
  const { user: currentUser, staffId } = useAuth();
  const { canHardDelete } = useUserRights();

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase.from('user').select('*').in('record_status', ['TERMINATED', 'SUSPENDED']).order('username', { ascending: true });
      const { data: productsData } = await supabase.from('product').select('*').in('record_status', ['INACTIVE', 'DELETED']).order('prodcode', { ascending: true });
      
      if (usersData) setTerminatedUsers(usersData);
      if (productsData) {
        setDeletedProducts(productsData.map((p: any) => ({ ...p, prodCode: p.prodCode || p.prodcode })));
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const triggerRecovery = (type: 'USER' | 'PRODUCT', id: string, isPurge: boolean = false) => {
    setPendingAction({ type, id, isPurge });
    setModalOpen(true);
  };

  const handleApplyAction = async () => {
    if (!pendingAction || !currentUser) return;
    try {
      if (pendingAction.isPurge) {
         if (pendingAction.type === 'USER') {
           await supabase.from('user').delete().eq('userid', pendingAction.id);
           await logAction({ actionType: 'USER_PURGED', module: 'Archive/Vault', status: 'Warning', description: `User ${pendingAction.id} was permanently purged`, targetId: pendingAction.id, performedBy: currentUser.id, staffId: staffId });
         } else {
           await supabase.from('product').delete().eq('prodcode', pendingAction.id);
           await logAction({ actionType: 'PRODUCT_PURGED', module: 'Archive/Vault', status: 'Warning', description: `Product ${pendingAction.id} was permanently purged`, targetId: pendingAction.id, performedBy: currentUser.id, staffId: staffId });
         }
      } else {
        if (pendingAction.type === 'USER') {
          const { error } = await supabase.from('user').update({ record_status: 'ACTIVE' }).eq('userid', pendingAction.id);
          if (!error) {
            await logAction({
              actionType: `USER_RESTORED`,
              module: 'Archive/Vault',
              status: 'Success',
              description: `User ${pendingAction.id} was restored`,
              targetId: pendingAction.id,
              performedBy: currentUser.id,
              staffId: staffId || 'UNKNOWN'
            });
          }
        } else {
          const { error } = await supabase.from('product').update({ record_status: 'ACTIVE' }).eq('prodcode', pendingAction.id);
          if (!error) {
             await logAction({
              actionType: `PRODUCT_RESTORED`,
              module: 'Archive/Vault',
              status: 'Success',
              description: `Product ${pendingAction.id} was restored`,
              targetId: pendingAction.id,
              performedBy: currentUser.id,
              staffId: staffId || 'UNKNOWN'
            });
          }
        }
      }
      await fetchArchives();
    } catch(e) { 
      console.error(e); 
    }
    setModalOpen(false);
    setPendingAction(null);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ArchiveRestore className="w-8 h-8 text-primary" /> Archive &amp; Recovery
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Restore suspended accounts and deleted inventory securely.</p>
        </div>
      </div>

      {loading ? (
          <div className="text-slate-500 dark:text-slate-400 text-center py-6">Loading archives...</div>
      ) : (
        <div className="space-y-8">
          {/* Deleted Items Table — DeletedItemsPage spec */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" /> Deleted Items
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">INACTIVE products — accessible to ADMIN / SUPERADMIN only.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Product Code</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Stamp</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {deletedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No deleted products found.</td>
                    </tr>
                  ) : deletedProducts.map(p => (
                    <tr key={p.prodCode} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">{p.prodCode}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.description}</td>
                      <td className="px-6 py-4 text-xs">
                        <span className="inline-flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded font-medium uppercase">
                          {p.record_status}
                        </span>
                        {p.updated_at && (
                          <div className="mt-1 text-slate-400 dark:text-slate-500">{new Date(p.updated_at).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => triggerRecovery('PRODUCT', p.prodCode)}
                            className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 px-3 py-1 rounded text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                          >
                            Recover
                          </button>
                          {canHardDelete && (
                            <button
                              onClick={() => triggerRecovery('PRODUCT', p.prodCode, true)}
                              className="text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              Purge
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suspended / Terminated Users */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm p-4 transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">Suspended / Terminated Users</h2>
            {terminatedUsers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No users found.</p>
            ) : terminatedUsers.map(u => (
              <div key={u.userid} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 mb-2 rounded border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{u.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{u.record_status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => triggerRecovery('USER', u.userid)} className="text-green-600 dark:text-green-400 font-medium text-sm hover:underline">
                    Restore
                  </button>
                  {canHardDelete && (
                    <button onClick={() => triggerRecovery('USER', u.userid, true)} className="text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                      Purge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ActionConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onVerified={handleApplyAction} 
        actionTitle={pendingAction?.isPurge ? "PERMANENT DATABASE PURGE" : "Irreversible Vault Extraction"}
        requireIdVerification={pendingAction?.isPurge}
      />
    </div>
  );
}
