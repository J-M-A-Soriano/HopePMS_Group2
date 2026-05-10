import { supabase } from '../supabase';

export type SystemConfig = {
  business_name: string;
  tax_id: string;
  shift_lockout: string;
  blueprint_prefix: string;
};

// Fetch current deep config from cloud
export const fetchSystemConfig = async (): Promise<SystemConfig | null> => {
  const { data, error } = await supabase
    .from('system_config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
    console.error('Error fetching system config:', error);
    return null;
  }
  
  if (data) return data as SystemConfig;
  return null;
};

// Overwrite the cloud config directly
export const updateSystemConfig = async (config: Partial<SystemConfig>) => {
  const { data, error } = await supabase
    .from('system_config')
    .update({ ...config, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};
