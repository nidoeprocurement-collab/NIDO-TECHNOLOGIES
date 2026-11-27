import { supabase } from '@/lib/supabase';

export interface ClientProfileRecord {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  client_employee_code: string | null;
  status: string;
  user_type: string;
  last_login_at: string | null;
  client_id: string;
  organization_name: string;
  client_code: string;
  role_name: string | null;
}

export async function fetchMyClientProfile(): Promise<ClientProfileRecord> {
  const { data, error } = await supabase.rpc('get_my_client_profile');
  if (error) {
    throw new Error(error.message || 'Unable to load client profile');
  }
  return data as ClientProfileRecord;
}

export async function updateMyClientProfile(input: {
  name: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
}): Promise<ClientProfileRecord> {
  const { data, error } = await supabase.rpc('update_my_client_profile', {
    p_name: input.name,
    p_phone: input.phone ?? null,
    p_designation: input.designation ?? null,
    p_department: input.department ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Unable to update client profile');
  }
  return data as ClientProfileRecord;
}

