import { loadMasterCatalogueFromSupabase } from '@/lib/masterCatalogueApi';
import { loadVendorsFromSupabase } from '@/lib/vendorsApi';
import { loadVendorProductsFromSupabase } from '@/lib/vendorProductsApi';
import { loadOrdersFromSupabase } from '@/lib/ordersApi';
import { loadPurchaseOrdersFromSupabase } from '@/lib/purchaseOrdersApi';
import { loadInventoryTransactionsFromSupabase } from '@/lib/inventoryTransactionsApi';
import {
  loadClientInvoicesFromSupabase,
  loadCreditNotesFromSupabase,
  loadDebitNotesFromSupabase,
  loadFinancialTransactionsFromSupabase,
  loadVendorBillsFromSupabase,
} from '@/lib/financeApi';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';

export interface HydratedReportSnapshot {
  ordersCount: number;
  purchaseOrdersCount: number;
  invoicesCount: number;
  billsCount: number;
  creditNotesCount: number;
  debitNotesCount: number;
  transactionsCount: number;
  inventoryTxnsCount: number;
}

export async function hydrateAllReportSourcesFromSupabase(
  clientId?: string,
): Promise<HydratedReportSnapshot> {
  const scopedClientId = clientId && isSupabaseUuid(clientId) ? clientId : undefined;
  const [
    ,
    ,
    ,
    orders,
    pos,
    invoices,
    bills,
    creditNotes,
    debitNotes,
    transactions,
    inventoryTxns,
  ] = await Promise.all([
    loadMasterCatalogueFromSupabase().catch(() => []),
    scopedClientId ? Promise.resolve([]) : loadVendorsFromSupabase().catch(() => []),
    scopedClientId ? Promise.resolve([]) : loadVendorProductsFromSupabase().catch(() => []),
    loadOrdersFromSupabase(scopedClientId).catch(() => []),
    scopedClientId ? Promise.resolve([]) : loadPurchaseOrdersFromSupabase().catch(() => []),
    loadClientInvoicesFromSupabase().catch(() => []),
    scopedClientId ? Promise.resolve([]) : loadVendorBillsFromSupabase().catch(() => []),
    loadCreditNotesFromSupabase().catch(() => []),
    loadDebitNotesFromSupabase().catch(() => []),
    loadFinancialTransactionsFromSupabase().catch(() => []),
    scopedClientId ? Promise.resolve([]) : loadInventoryTransactionsFromSupabase().catch(() => []),
  ]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('nidoReportRefresh'));
  }

  return {
    ordersCount: orders.length,
    purchaseOrdersCount: pos.length,
    invoicesCount: invoices.length,
    billsCount: bills.length,
    creditNotesCount: creditNotes.length,
    debitNotesCount: debitNotes.length,
    transactionsCount: transactions.length,
    inventoryTxnsCount: inventoryTxns.length,
  };
}
