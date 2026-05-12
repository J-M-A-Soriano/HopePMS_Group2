import { supabase } from '../supabase';
import { getDeviceInfo, getIPAddress } from '../../utils/deviceInfo';

export type AuditLog = {
  id: string;
  performed_by: string;
  staff_id_used?: string;
  action_type: string;
  target_id: string;
  metadata: {
    module: string;
    status: 'Success' | 'Failed' | 'Warning' | 'Info';
    description: string;
    old_value?: any;
    new_value?: any;
    ip_address?: string;
    device_info?: string;
    user_name?: string;
    user_role?: string;
    [key: string]: any;
  };
  created_at: string;
};

interface LogActionParams {
  actionType: string;
  module: string;
  status: 'Success' | 'Failed' | 'Warning' | 'Info';
  description: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  performedBy?: string; // UUID
  staffId?: string;
  userName?: string;
  userRole?: string;
}

export const logAction = async (params: LogActionParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Attempt to get user from params, then fallback to current session
    const performedBy = params.performedBy || user?.id || '00000000-0000-0000-0000-000000000000';
    
    // Fetch user details if not provided
    let staffId = params.staffId;
    let userName = params.userName;
    let userRole = params.userRole;

    if ((!staffId || !userName || !userRole) && user) {
        const { data: profile } = await supabase.from('user').select('staff_id, username, user_type').eq('userid', user.id).single();
        if (profile) {
            staffId = staffId || profile.staff_id;
            userName = userName || profile.username;
            userRole = userRole || profile.user_type;
        }
    }

    const deviceInfo = getDeviceInfo();
    const ipAddress = await getIPAddress();

    const metadata = {
      module: params.module,
      status: params.status,
      description: params.description,
      old_value: params.oldValue,
      new_value: params.newValue,
      ip_address: ipAddress,
      device_info: deviceInfo,
      user_name: userName || 'System',
      user_role: userRole || 'System',
    };

    const { error } = await supabase.from('audit_logs').insert([{
      performed_by: performedBy,
      staff_id_used: staffId || 'SYSTEM',
      action_type: params.actionType,
      target_id: params.targetId || null,
      metadata: metadata
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
