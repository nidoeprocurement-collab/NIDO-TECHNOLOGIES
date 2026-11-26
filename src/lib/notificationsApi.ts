import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';

export interface DbNotificationRow {
  id: string;
  dedupe_key: string | null;
  recipient_user_id: string;
  client_id: string | null;
  title: string;
  description: string;
  notification_type: string;
  module: string;
  entity_reference: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface DbNotificationPreferencesRow {
  user_id: string;
  client_id: string | null;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  category_preferences: Record<string, unknown>;
  updated_at: string;
}

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export async function loadNotificationsFromSupabase(limit = 50): Promise<DbNotificationRow[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message || 'Unable to load notifications.');
  return Array.isArray(data) ? (data as DbNotificationRow[]) : [];
}

export async function markNotificationReadInSupabase(notificationId: string): Promise<void> {
  if (!isSupabaseUuid(notificationId)) return;
  assertSupabaseFrom();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw new Error(error.message || 'Unable to mark notification as read.');
}

export async function createUserNotificationInSupabase(params: {
  recipientUserId: string;
  title: string;
  description: string;
  module: string;
  notificationType?: string;
  entityReference?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionLink?: string;
  clientId?: string;
  dedupeKey?: string;
}): Promise<DbNotificationRow> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('create_user_notification', {
    p_recipient_user_id: params.recipientUserId,
    p_title: params.title,
    p_description: params.description,
    p_module: params.module,
    p_notification_type: params.notificationType ?? 'info',
    p_entity_reference: params.entityReference ?? null,
    p_priority: params.priority ?? 'normal',
    p_action_link: params.actionLink ?? null,
    p_client_id: params.clientId && isSupabaseUuid(params.clientId) ? params.clientId : null,
    p_dedupe_key: params.dedupeKey ?? null,
  });
  if (error) throw new Error(error.message || 'Unable to create notification.');
  return data as DbNotificationRow;
}

export async function loadNotificationPreferencesFromSupabase(
  userId: string,
): Promise<DbNotificationPreferencesRow | null> {
  if (!isSupabaseUuid(userId)) return null;
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Unable to load notification preferences.');
  return (data as DbNotificationPreferencesRow | null) ?? null;
}

export async function saveNotificationPreferencesInSupabase(params: {
  userId: string;
  clientId?: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  categoryPreferences?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseUuid(params.userId)) return;
  assertSupabaseFrom();
  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: params.userId,
      client_id: params.clientId && isSupabaseUuid(params.clientId) ? params.clientId : null,
      email_enabled: params.emailEnabled,
      sms_enabled: params.smsEnabled,
      in_app_enabled: params.inAppEnabled,
      category_preferences: params.categoryPreferences ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(error.message || 'Unable to save notification preferences.');
}
