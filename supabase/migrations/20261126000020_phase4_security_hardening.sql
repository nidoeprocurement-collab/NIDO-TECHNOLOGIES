-- Phase 4: Security Hardening & Performance Indexing
-- 1. Revoke default PUBLIC / anon EXECUTE grants on trigger/utility functions in app & public schemas.
-- 2. Add covering indexes on high-traffic business foreign keys identified in Phase 4 audit.

REVOKE ALL ON FUNCTION app.trg_client_catalogue_before_write() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.trg_master_catalogue_items_before_write() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.trg_protect_client_role_lifecycle() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.trg_vendor_products_before_write() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.trg_vendors_before_write() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;

-- High-traffic operational & financial FK indexes (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_payment_allocations_transaction_id ON public.payment_allocations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_bill_id ON public.payment_allocations(bill_id) WHERE bill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice_id ON public.payment_allocations(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debit_notes_vendor_id ON public.debit_notes(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debit_notes_client_id ON public.debit_notes(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_notes_client_id ON public.credit_notes(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_notes_vendor_id ON public.credit_notes(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debit_note_items_debit_note_id ON public.debit_note_items(debit_note_id);
CREATE INDEX IF NOT EXISTS idx_credit_note_items_credit_note_id ON public.credit_note_items(credit_note_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_id ON public.financial_transactions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financial_transactions_vendor_id ON public.financial_transactions(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON public.notifications(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON public.notification_delivery_logs(notification_id);

