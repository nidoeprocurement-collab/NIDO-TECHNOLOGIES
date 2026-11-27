import { supabase } from '@/lib/supabase';

export interface DbNidoOrganization {
  id: string;
  org_code: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  is_default: boolean;
  status: string;
}

export interface DbDocumentSequence {
  id: string;
  seq_key: string;
  prefix: string;
  next_value: number;
  pad_length: number;
  include_year: boolean;
  year_separator: string;
  description: string | null;
  updated_at: string;
}

export async function loadDefaultNidoOrgSettingsFromSupabase(): Promise<{
  organization: DbNidoOrganization | null;
  settings: Record<string, unknown> | null;
}> {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }

  const { data: org, error: orgErr } = await supabase
    .from('nido_organizations')
    .select('id,org_code,name,legal_name,tax_id,is_default,status')
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orgErr) {
    throw new Error(orgErr.message || 'Unable to load NIDO organization.');
  }

  if (!org) {
    return { organization: null, settings: null };
  }

  const { data: settingsRow, error: settingsErr } = await supabase
    .from('organization_settings')
    .select('id,settings')
    .eq('scope_type', 'nido_org')
    .eq('nido_org_id', org.id)
    .maybeSingle();

  if (settingsErr) {
    throw new Error(settingsErr.message || 'Unable to load organization settings.');
  }

  return {
    organization: org as DbNidoOrganization,
    settings: (settingsRow?.settings as Record<string, unknown> | undefined) ?? null,
  };
}

export async function saveDefaultNidoOrgSettingsToSupabase(
  nidoOrgId: string,
  settingsPayload: Record<string, unknown>,
  orgPatch?: { name?: string; legal_name?: string | null; tax_id?: string | null },
): Promise<void> {
  if (orgPatch && Object.keys(orgPatch).length > 0) {
    const { error: orgUpdateErr } = await supabase
      .from('nido_organizations')
      .update(orgPatch)
      .eq('id', nidoOrgId);
    if (orgUpdateErr) {
      throw new Error(orgUpdateErr.message || 'Unable to update NIDO organization.');
    }
  }

  const { data: existing } = await supabase
    .from('organization_settings')
    .select('id')
    .eq('scope_type', 'nido_org')
    .eq('nido_org_id', nidoOrgId)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateErr } = await supabase
      .from('organization_settings')
      .update({ settings: settingsPayload })
      .eq('id', existing.id);
    if (updateErr) {
      throw new Error(updateErr.message || 'Unable to save organization settings.');
    }
  } else {
    const { error: insertErr } = await supabase
      .from('organization_settings')
      .insert({
        scope_type: 'nido_org',
        nido_org_id: nidoOrgId,
        settings: settingsPayload,
      });
    if (insertErr) {
      throw new Error(insertErr.message || 'Unable to create organization settings.');
    }
  }
}

export async function loadPlatformSettingsFromSupabase(
  category?: string,
): Promise<Record<string, unknown>> {
  let query = supabase
    .from('platform_settings')
    .select('setting_key,category,value');
  if (category) {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load platform settings.');
  }
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[String(row.setting_key)] = row.value;
  }
  return map;
}

export async function savePlatformSettingToSupabase(
  settingKey: string,
  category: string,
  value: unknown,
  description?: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('platform_settings')
    .select('id')
    .eq('setting_key', settingKey)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('platform_settings')
      .update({ category, value, description: description ?? null })
      .eq('id', existing.id);
    if (error) throw new Error(error.message || 'Unable to update platform setting.');
  } else {
    const { error } = await supabase
      .from('platform_settings')
      .insert({ setting_key: settingKey, category, value, description: description ?? null });
    if (error) throw new Error(error.message || 'Unable to save platform setting.');
  }
}

export async function listDocumentSequencesFromSupabase(): Promise<DbDocumentSequence[]> {
  const { data, error } = await supabase.rpc('list_document_sequences');
  if (error) {
    throw new Error(error.message || 'Unable to load document sequences.');
  }
  return (Array.isArray(data) ? data : []) as DbDocumentSequence[];
}

export async function upsertDocumentSequenceInSupabase(input: {
  seq_key: string;
  prefix: string;
  pad_length?: number;
  include_year?: boolean;
  year_separator?: string;
  description?: string;
}): Promise<DbDocumentSequence> {
  const { data, error } = await supabase.rpc('upsert_document_sequence', {
    p_seq_key: input.seq_key,
    p_prefix: input.prefix,
    p_pad_length: input.pad_length ?? 5,
    p_include_year: input.include_year ?? false,
    p_year_separator: input.year_separator ?? '-',
    p_description: input.description ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Unable to save document sequence.');
  }
  return data as DbDocumentSequence;
}

export async function allocateDocumentNumberInSupabase(seqKey: string): Promise<string> {
  const { data, error } = await supabase.rpc('allocate_document_number', {
    p_seq_key: seqKey,
  });
  if (error) {
    throw new Error(error.message || 'Unable to allocate document number.');
  }
  return String(data ?? '');
}

