import { supabase } from '../supabase';

export type AuditLog = {
  id: string;
  performed_by: string;
  action_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
};
export const logAction = async (actionType: string, targetId: string, details: any, performedBy: string) => {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      performed_by: performedBy,
      action_type: actionType,
      target_id: targetId,
      metadata: details
    }]);

    if (error) {
      console.error('Failed to log audit action:', error);
    }
  } catch (err) {
    console.error('Error logging audit action:', err);
  }
};

export const fetchMyActivity = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('performed_by', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as AuditLog[];
};
