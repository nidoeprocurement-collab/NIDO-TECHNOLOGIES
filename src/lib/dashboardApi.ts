import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';

export interface DashboardSummaryMetrics {
  total_orders: number;
  pending_orders: number;
  approved_orders: number;
  rejected_orders: number;
  completed_orders: number;
  total_procurement_spend: number;
  outstanding_invoices_count: number;
  outstanding_invoices_amount: number;
  total_purchase_orders: number;
  total_po_value: number;
  outstanding_bills_count: number;
  outstanding_bills_amount: number;
  active_vendors: number;
  total_clients: number;
  total_grns: number;
  pending_deliveries: number;
}

export async function loadDashboardSummaryFromSupabase(
  clientId?: string | null,
  period: 'all' | 'month' | 'quarter' | 'year' = 'all',
): Promise<DashboardSummaryMetrics> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_client_id: clientId && isSupabaseUuid(clientId) ? clientId : null,
    p_period: period,
  });

  if (error) {
    throw new Error(error.message || 'Unable to load dashboard summary.');
  }

  return data as DashboardSummaryMetrics;
}
