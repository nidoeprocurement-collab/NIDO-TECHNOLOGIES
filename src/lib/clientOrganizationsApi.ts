import { supabase } from '@/lib/supabase';
import { invokeSupabaseEdgeFunction } from '@/lib/edgeFunctionError';
import type { StoredClient } from '@/lib/clientStore';

interface DbClientOrganizationRow {
  id: string;
  client_code: string | null;
  nido_org_id: string | null;
  name: string;
  category: string | null;
  tier: string | null;
  rep_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  tax_id: string | null;
  pan: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_pincode: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  status: string;
  archived_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function mapDbClientOrgToStoredClient(row: DbClientOrganizationRow): StoredClient {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    ...meta,
    id: String(row.id),
    clientCode: row.client_code ?? undefined,
    name: String(row.name ?? ''),
    category: row.category ?? undefined,
    tier: row.tier ?? undefined,
    rep: row.rep_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    mobile: row.mobile ?? undefined,
    website: row.website ?? undefined,
    gstin: row.tax_id ?? (meta.gstin as string | undefined),
    pan: row.pan ?? (meta.pan as string | undefined),
    contractStartDate: row.contract_start_date ?? undefined,
    contractEndDate: row.contract_end_date ?? undefined,
    billingAddress: row.billing_address ?? undefined,
    billingCity: row.billing_city ?? undefined,
    billingState: row.billing_state ?? undefined,
    billingPincode: row.billing_pincode ?? undefined,
    status: row.status === 'Archived' ? 'Archived' : row.status === 'Inactive' ? 'Inactive' : 'Active',
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadClientOrganizationsFromSupabase(): Promise<StoredClient[]> {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }

  const { data, error } = await supabase
    .from('client_organizations')
    .select(
      'id,client_code,nido_org_id,name,category,tier,rep_name,email,phone,mobile,website,tax_id,pan,billing_address,billing_city,billing_state,billing_pincode,contract_start_date,contract_end_date,status,archived_at,metadata,created_at,updated_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load client organizations from Supabase.');
  }

  return (Array.isArray(data) ? (data as DbClientOrganizationRow[]) : []).map(
    mapDbClientOrgToStoredClient,
  );
}

export async function loadClientOrganizationByIdFromSupabase(
  clientId: string,
): Promise<StoredClient | null> {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }

  const { data, error } = await supabase
    .from('client_organizations')
    .select(
      'id,client_code,nido_org_id,name,category,tier,rep_name,email,phone,mobile,website,tax_id,pan,billing_address,billing_city,billing_state,billing_pincode,contract_start_date,contract_end_date,status,archived_at,metadata,created_at,updated_at',
    )
    .eq('id', clientId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load client organization from Supabase.');
  }

  if (!data) return null;
  return mapDbClientOrgToStoredClient(data as DbClientOrganizationRow);
}

export async function createClientOrganizationWithAdminInSupabase(input: {
  clientName: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  category?: string;
  tier?: string;
  repName?: string;
}): Promise<{ client_id: string; client_code?: string; client_user_id?: string }> {
  return invokeSupabaseEdgeFunction<{
    success: boolean;
    client_id: string;
    client_code?: string;
    client_user_id?: string;
  }>(
    'provision-client-access',
    {
      action: 'create_client_organization_admin',
      client_name: input.clientName,
      name: input.adminName,
      email: input.adminEmail,
      phone: input.phone || undefined,
      category: input.category || undefined,
      tier: input.tier || undefined,
      rep_name: input.repName || undefined,
    },
    'Unable to provision client organization and initial admin.',
  );
}

export async function updateClientOrganizationInSupabase(
  clientId: string,
  patch: Partial<{
    name: string;
    category: string | null;
    tier: string | null;
    rep_name: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    website: string | null;
    tax_id: string | null;
    pan: string | null;
    billing_address: string | null;
    billing_city: string | null;
    billing_state: string | null;
    billing_pincode: string | null;
    contract_start_date: string | null;
    contract_end_date: string | null;
    status: 'Active' | 'Inactive' | 'Archived';
    archived_at: string | null;
    metadata: Record<string, unknown>;
  }>,
): Promise<StoredClient> {
  const { data, error } = await supabase
    .from('client_organizations')
    .update(patch)
    .eq('id', clientId)
    .select(
      'id,client_code,nido_org_id,name,category,tier,rep_name,email,phone,mobile,website,tax_id,pan,billing_address,billing_city,billing_state,billing_pincode,contract_start_date,contract_end_date,status,archived_at,metadata,created_at,updated_at',
    )
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to update client organization.');
  }

  return mapDbClientOrgToStoredClient(data as DbClientOrganizationRow);
}

