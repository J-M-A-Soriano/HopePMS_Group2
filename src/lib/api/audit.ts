import { supabase } from '../supabase';

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
