import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArchiveRestore, Trash2 } from 'lucide-react';
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
      const { data: usersData } = await supabase.from('user').select('*').in('record_status', ['TERMINATED', 'SUSPENDED']);
      const { data: productsData } = await supabase.from('product').select('*').in('record_status', ['INACTIVE', 'DELETED']);
      
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
           await supabase.from('audit_logs').insert([{ performed_by: currentUser.id, action_type: `USER_PURGED`, target_id: pendingAction.id, staff_id_used: staffId }]);
         } else {
           await supabase.from('product').delete().eq('prodCode', pendingAction.id);
           await supabase.from('audit_logs').insert([{ performed_by: currentUser.id, action_type: `PRODUCT_PURGED`, target_id: pendingAction.id, staff_id_used: staffId }]);
         }
      } else {
        if (pendingAction.type === 'USER') {
          const { error } = await supabase.from('user').update({ record_status: 'ACTIVE' }).eq('userid', pendingAction.id);
          if (!error) {
            await supabase.from('audit_logs').insert([{
              performed_by: currentUser.id,
              action_type: `USER_RESTORED`,
              target_id: pendingAction.id,
              staff_id_used: staffId || 'UNKNOWN',
              metadata: { target_type: 'USER' }
            }]);
          }
        } else {
          const { error } = await supabase.from('product').update({ record_status: 'ACTIVE' }).eq('prodCode', pendingAction.id);
          if (!error) {
             await supabase.from('audit_logs').insert([{
              performed_by: currentUser.id,
              action_type: `PRODUCT_RESTORED`,
              target_id: currentUser.id,
              staff_id_used: staffId || 'UNKNOWN',
              metadata: { target_type: 'PRODUCT', prodCode: pendingAction.id }
            }]);
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ArchiveRestore className="w-8 h-8 text-primary" /> Archive & Recovery
          </h1>
          <p className="text-slate-500">Restore suspended accounts and deleted inventory securely.</p>
        </div>
      </div>

      {loading ? (
          <div className="text-slate-500 text-center py-6">Loading archives...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border shadow-sm p-4">
             <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Suspended / Terminated Users</h2>
             {terminatedUsers.length === 0 ? <p className="text-sm text-slate-500">No users found.</p> : terminatedUsers.map(u => (
               <div key={u.userid} className="flex justify-between items-center bg-slate-50 p-3 mb-2 rounded border border-slate-100">
                  <div>
                    <p className="font-semibold">{u.username}</p>
                    <p className="text-xs text-slate-500 uppercase">{u.record_status}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => triggerRecovery('USER', u.userid)} className="text-green-600 font-medium text-sm hover:underline">
                      Restore
                    </button>
                    {canHardDelete && (
                      <button onClick={() => triggerRecovery('USER', u.userid, true)} className="text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded text-xs font-medium hover:bg-red-100 transition-colors">
                        Purge
                      </button>
                    )}
                  </div>
               </div>
             ))}
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-4">
             <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Deleted Products</h2>
             {deletedProducts.length === 0 ? <p className="text-sm text-slate-500">No products found.</p> : deletedProducts.map(p => (
               <div key={p.prodCode} className="flex justify-between items-center bg-slate-50 p-3 mb-2 rounded border border-slate-100">
                  <div>
                    <p className="font-semibold">{p.description}</p>
                    <p className="text-xs text-slate-500">Code: {p.prodCode}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => triggerRecovery('PRODUCT', p.prodCode)} className="text-green-600 font-medium text-sm hover:underline">
                      Restore
                    </button>
                    {canHardDelete && (
                      <button onClick={() => triggerRecovery('PRODUCT', p.prodCode, true)} className="text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded text-xs font-medium hover:bg-red-100 transition-colors">
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
      />
    </div>
  );
}
