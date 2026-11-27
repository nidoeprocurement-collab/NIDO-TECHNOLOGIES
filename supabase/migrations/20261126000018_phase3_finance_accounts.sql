-- ============================================================================
-- NIDO Phase 3 – Wave 2.4: Bills, Invoices, Debit/Credit Notes & Payments
-- ============================================================================

INSERT INTO public.document_sequences (
  seq_key, prefix, next_value, pad_length, include_year, year_separator, description
)
VALUES
  ('BILL', 'BILL-', 1001, 4, false, '-', 'Vendor Bill number (BILL-NNNN)'),
  ('INV', 'INV-', 1001, 4, false, '-', 'Client Invoice number (INV-NNNN)'),
  ('DN', 'DN-', 1001, 4, false, '-', 'Debit Note number (DN-NNNN)'),
  ('CN', 'CN-', 1001, 4, false, '-', 'Credit Note number (CN-NNNN)'),
  ('TXN', 'TXN-', 1001, 5, false, '-', 'Financial Transaction reference (TXN-NNNNN)')
ON CONFLICT (seq_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 1. Vendor Bills (Accounts Payable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL UNIQUE,
  internal_reference text NULL,
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  vendor_name text NOT NULL,
  vendor_invoice_number text NULL,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NULL,
  purchase_order_id uuid NULL REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  po_number text NULL,
  goods_receipt_id uuid NULL REFERENCES public.goods_receipts(id) ON DELETE SET NULL,
  grn_number text NULL,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  total_discount numeric(12, 2) NOT NULL DEFAULT 0,
  taxable_amount numeric(12, 2) NOT NULL DEFAULT 0,
  cgst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  sgst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  igst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_tax numeric(12, 2) NOT NULL DEFAULT 0,
  additional_charges numeric(12, 2) NOT NULL DEFAULT 0,
  tds_amount numeric(12, 2) NOT NULL DEFAULT 0,
  grand_total numeric(12, 2) NOT NULL DEFAULT 0,
  amount_paid numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  outstanding_balance numeric(12, 2) GENERATED ALWAYS AS (GREATEST(0, grand_total - tds_amount - amount_paid)) STORED,
  payment_terms text NULL,
  notes text NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Draft' CHECK (
    status IN ('Draft', 'Pending Approval', 'Approved', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_bills_vendor_invoice
  ON public.vendor_bills (vendor_id, lower(btrim(vendor_invoice_number)))
  WHERE vendor_id IS NOT NULL AND vendor_invoice_number IS NOT NULL AND btrim(vendor_invoice_number) <> '';

CREATE TABLE IF NOT EXISTS public.vendor_bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.vendor_bills(id) ON DELETE CASCADE,
  purchase_order_item_id uuid NULL REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  description text NOT NULL,
  sku text NULL,
  hsn_sac text NULL,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  gst_rate numeric(5, 2) NOT NULL DEFAULT 0,
  cgst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  sgst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  igst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Client Invoices (Accounts Receivable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  source_proforma_id uuid NULL REFERENCES public.client_invoices(id) ON DELETE SET NULL,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  contact_person text NULL,
  client_gstin text NULL,
  client_contact text NULL,
  client_contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  billing_address text NULL,
  shipping_address text NULL,
  place_of_supply text NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NULL,
  order_id uuid NULL REFERENCES public.procurement_orders(id) ON DELETE SET NULL,
  originating_order_number text NULL,
  po_reference text NULL,
  gross_subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  total_discount numeric(12, 2) NOT NULL DEFAULT 0,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  cgst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  sgst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  igst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_tax numeric(12, 2) NOT NULL DEFAULT 0,
  shipping_charges numeric(12, 2) NOT NULL DEFAULT 0,
  platform_fee numeric(12, 2) NOT NULL DEFAULT 0,
  adjustment numeric(12, 2) NOT NULL DEFAULT 0,
  grand_total numeric(12, 2) NOT NULL DEFAULT 0,
  amount_received numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount_received >= 0),
  outstanding_amount numeric(12, 2) GENERATED ALWAYS AS (GREATEST(0, grand_total - amount_received)) STORED,
  payment_terms text NULL,
  terms_conditions text NULL,
  bank_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Draft' CHECK (
    status IN ('Draft', 'Proforma Invoice', 'Sent', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')
  ),
  archived boolean NOT NULL DEFAULT false,
  sent_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_invoices_client ON public.client_invoices (client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.client_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.client_invoices(id) ON DELETE CASCADE,
  sub_order_id text NULL,
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  client_catalogue_item_id uuid NULL REFERENCES public.client_catalogue_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  item_details text NULL,
  hsn_sac text NULL,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'Unit',
  rate numeric(12, 2) NOT NULL DEFAULT 0,
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  discount_pct numeric(7, 3) NOT NULL DEFAULT 0,
  tax_percent numeric(5, 2) NOT NULL DEFAULT 0,
  tax_type text NULL,
  line_total numeric(12, 2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Debit Notes & Credit Notes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number text NOT NULL UNIQUE,
  party_type text NOT NULL CHECK (party_type IN ('vendor', 'client')),
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  party_name text NOT NULL,
  bill_id uuid NULL REFERENCES public.vendor_bills(id) ON DELETE RESTRICT,
  invoice_id uuid NULL REFERENCES public.client_invoices(id) ON DELETE RESTRICT,
  source_document_number text NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text NOT NULL,
  taxable_value numeric(12, 2) NOT NULL DEFAULT 0,
  gst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft' CHECK (
    status IN ('Draft', 'Pending Approval', 'Approved', 'Issued', 'Applied', 'Cancelled')
  ),
  remarks text NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.debit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_id uuid NOT NULL REFERENCES public.debit_notes(id) ON DELETE CASCADE,
  description text NOT NULL,
  hsn_sac text NULL,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  taxable_value numeric(12, 2) NOT NULL DEFAULT 0,
  gst_rate numeric(5, 2) NOT NULL DEFAULT 0,
  gst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number text NOT NULL UNIQUE,
  party_type text NOT NULL CHECK (party_type IN ('client', 'vendor')),
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  party_name text NOT NULL,
  invoice_id uuid NULL REFERENCES public.client_invoices(id) ON DELETE RESTRICT,
  bill_id uuid NULL REFERENCES public.vendor_bills(id) ON DELETE RESTRICT,
  source_document_number text NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text NOT NULL,
  taxable_value numeric(12, 2) NOT NULL DEFAULT 0,
  gst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft' CHECK (
    status IN ('Draft', 'Pending Approval', 'Approved', 'Issued', 'Applied', 'Cancelled')
  ),
  remarks text NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id uuid NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  description text NOT NULL,
  hsn_sac text NULL,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  taxable_value numeric(12, 2) NOT NULL DEFAULT 0,
  gst_rate numeric(5, 2) NOT NULL DEFAULT 0,
  gst_amount numeric(12, 2) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 4. Financial Transactions, Payment Allocations & Audit History
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference text NOT NULL UNIQUE,
  idempotency_key text NULL UNIQUE,
  ledger_type text NOT NULL CHECK (ledger_type IN ('receivable', 'payable')),
  payment_type text NOT NULL DEFAULT 'Payment',
  payment_method text NOT NULL,
  bank_account text NULL,
  utr_reference text NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  party_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'paid', 'cancelled')),
  notes text NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  recorded_by text NOT NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  bill_id uuid NULL REFERENCES public.vendor_bills(id) ON DELETE RESTRICT,
  invoice_id uuid NULL REFERENCES public.client_invoices(id) ON DELETE RESTRICT,
  allocated_amount numeric(12, 2) NOT NULL CHECK (allocated_amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payment_alloc_target CHECK (
    (bill_id IS NOT NULL AND invoice_id IS NULL) OR (bill_id IS NULL AND invoice_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.financial_document_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('vendor_bill', 'client_invoice', 'debit_note', 'credit_note', 'financial_transaction')),
  document_id uuid NOT NULL,
  document_number text NOT NULL,
  action_type text NOT NULL,
  previous_status text NULL,
  new_status text NULL,
  reason text NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_doc_history_doc ON public.financial_document_status_history (document_type, document_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. Row-Level Security (Default-Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE public.vendor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_document_status_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.vendor_bills FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.vendor_bill_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.client_invoices FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.client_invoice_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.debit_notes FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.debit_note_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.credit_notes FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.credit_note_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.financial_transactions FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.payment_allocations FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.financial_document_status_history FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendor_bills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendor_bill_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.debit_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.debit_note_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_note_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_document_status_history TO authenticated;

-- Internal-only AP (Vendor Bills)
DROP POLICY IF EXISTS vendor_bills_internal ON public.vendor_bills;
CREATE POLICY vendor_bills_internal ON public.vendor_bills
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('bills', 'view') OR app.has_nido_permission('finance', 'view')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('finance', 'edit')));

DROP POLICY IF EXISTS vendor_bill_items_internal ON public.vendor_bill_items;
CREATE POLICY vendor_bill_items_internal ON public.vendor_bill_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- Client Invoices (Internal R/W, Client Portal SELECT own client_id)
DROP POLICY IF EXISTS client_invoices_select ON public.client_invoices;
CREATE POLICY client_invoices_select ON public.client_invoices
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND (app.has_nido_permission('invoices', 'view') OR app.has_nido_permission('finance', 'view')))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS client_invoices_write ON public.client_invoices;
CREATE POLICY client_invoices_write ON public.client_invoices
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('finance', 'edit')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('finance', 'edit')));

DROP POLICY IF EXISTS client_invoice_items_select ON public.client_invoice_items;
CREATE POLICY client_invoice_items_select ON public.client_invoice_items
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    OR EXISTS (SELECT 1 FROM public.client_invoices ci WHERE ci.id = invoice_id AND ci.client_id = app.current_client_id())
  );

DROP POLICY IF EXISTS client_invoice_items_write ON public.client_invoice_items;
CREATE POLICY client_invoice_items_write ON public.client_invoice_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- Debit & Credit Notes (Internal R/W, Client Portal SELECT own client_id)
DROP POLICY IF EXISTS debit_notes_select ON public.debit_notes;
CREATE POLICY debit_notes_select ON public.debit_notes
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() OR client_id = app.current_client_id());

DROP POLICY IF EXISTS debit_notes_write ON public.debit_notes;
CREATE POLICY debit_notes_write ON public.debit_notes
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS debit_note_items_rw ON public.debit_note_items;
CREATE POLICY debit_note_items_rw ON public.debit_note_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS credit_notes_select ON public.credit_notes;
CREATE POLICY credit_notes_select ON public.credit_notes
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() OR client_id = app.current_client_id());

DROP POLICY IF EXISTS credit_notes_write ON public.credit_notes;
CREATE POLICY credit_notes_write ON public.credit_notes
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS credit_note_items_rw ON public.credit_note_items;
CREATE POLICY credit_note_items_rw ON public.credit_note_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- Financial Transactions, Allocations & Audit History
DROP POLICY IF EXISTS financial_transactions_select ON public.financial_transactions;
CREATE POLICY financial_transactions_select ON public.financial_transactions
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    OR (ledger_type = 'receivable' AND client_id = app.current_client_id())
  );

DROP POLICY IF EXISTS financial_transactions_write ON public.financial_transactions;
CREATE POLICY financial_transactions_write ON public.financial_transactions
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS payment_allocations_rw ON public.payment_allocations;
CREATE POLICY payment_allocations_rw ON public.payment_allocations
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS fin_doc_history_rw ON public.financial_document_status_history;
CREATE POLICY fin_doc_history_rw ON public.financial_document_status_history
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- ----------------------------------------------------------------------------
-- 6. Atomic Financial Payment & Credit/Debit Note RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_financial_payment_atomic(
  p_ledger_type text,
  p_payment_method text,
  p_amount numeric,
  p_party_name text,
  p_status text DEFAULT 'paid',
  p_idempotency_key text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_vendor_id uuid DEFAULT NULL,
  p_bill_id uuid DEFAULT NULL,
  p_invoice_id uuid DEFAULT NULL,
  p_bank_account text DEFAULT NULL,
  p_utr_reference text DEFAULT NULL,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_notes text DEFAULT NULL,
  p_recorded_by text DEFAULT 'Finance Team'
)
RETURNS public.financial_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing public.financial_transactions%ROWTYPE;
  v_txn public.financial_transactions%ROWTYPE;
  v_txn_ref text;
  v_bill public.vendor_bills%ROWTYPE;
  v_inv public.client_invoices%ROWTYPE;
  v_new_paid numeric(12, 2);
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO finance authorization required' USING ERRCODE = '42501';
  END IF;

  IF btrim(COALESCE(p_idempotency_key, '')) <> '' THEN
    SELECT * INTO v_existing FROM public.financial_transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  v_txn_ref := public.allocate_document_number('TXN', NULL);

  INSERT INTO public.financial_transactions (
    transaction_reference, idempotency_key, ledger_type, payment_method, bank_account,
    utr_reference, payment_date, amount, client_id, vendor_id, party_name,
    status, notes, recorded_by, created_by
  ) VALUES (
    v_txn_ref, NULLIF(btrim(COALESCE(p_idempotency_key, '')), ''), p_ledger_type, p_payment_method,
    p_bank_account, p_utr_reference, COALESCE(p_payment_date, CURRENT_DATE), p_amount,
    p_client_id, p_vendor_id, p_party_name, COALESCE(p_status, 'paid'), p_notes,
    COALESCE(NULLIF(btrim(p_recorded_by), ''), 'Finance Team'), v_uid
  )
  RETURNING * INTO v_txn;

  -- Draft payments do NOT alter bill or invoice balances
  IF p_status IN ('paid', 'completed') THEN
    IF p_bill_id IS NOT NULL THEN
      SELECT * INTO v_bill FROM public.vendor_bills WHERE id = p_bill_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Vendor bill not found' USING ERRCODE = '23503';
      END IF;
      v_new_paid := COALESCE(v_bill.amount_paid, 0) + p_amount;
      IF v_new_paid > GREATEST(0, v_bill.grand_total - COALESCE(v_bill.tds_amount, 0)) + 0.01 THEN
        RAISE EXCEPTION 'Payment (%) exceeds outstanding bill balance', p_amount USING ERRCODE = '22023';
      END IF;

      INSERT INTO public.payment_allocations (transaction_id, bill_id, allocated_amount)
      VALUES (v_txn.id, v_bill.id, p_amount);

      UPDATE public.vendor_bills
      SET amount_paid = v_new_paid,
          status = CASE WHEN v_new_paid >= GREATEST(0, grand_total - COALESCE(tds_amount, 0)) THEN 'Paid' ELSE 'Partially Paid' END,
          updated_by = v_uid,
          updated_at = now()
      WHERE id = v_bill.id;

      INSERT INTO public.financial_document_status_history (
        document_type, document_id, document_number, action_type, previous_status, new_status, actor_user_id, actor_name
      ) VALUES (
        'vendor_bill', v_bill.id, v_bill.bill_number, 'payment', v_bill.status,
        CASE WHEN v_new_paid >= GREATEST(0, v_bill.grand_total - COALESCE(v_bill.tds_amount, 0)) THEN 'Paid' ELSE 'Partially Paid' END,
        v_uid, COALESCE(NULLIF(btrim(p_recorded_by), ''), 'Finance Team')
      );
    ELSIF p_invoice_id IS NOT NULL THEN
      SELECT * INTO v_inv FROM public.client_invoices WHERE id = p_invoice_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Client invoice not found' USING ERRCODE = '23503';
      END IF;
      v_new_paid := COALESCE(v_inv.amount_received, 0) + p_amount;
      IF v_new_paid > v_inv.grand_total + 0.01 THEN
        RAISE EXCEPTION 'Payment (%) exceeds outstanding invoice balance', p_amount USING ERRCODE = '22023';
      END IF;

      INSERT INTO public.payment_allocations (transaction_id, invoice_id, allocated_amount)
      VALUES (v_txn.id, v_inv.id, p_amount);

      UPDATE public.client_invoices
      SET amount_received = v_new_paid,
          status = CASE WHEN v_new_paid >= grand_total THEN 'Paid' ELSE 'Partially Paid' END,
          updated_by = v_uid,
          updated_at = now()
      WHERE id = v_inv.id;

      INSERT INTO public.financial_document_status_history (
        document_type, document_id, document_number, action_type, previous_status, new_status, actor_user_id, actor_name
      ) VALUES (
        'client_invoice', v_inv.id, v_inv.invoice_number, 'payment', v_inv.status,
        CASE WHEN v_new_paid >= v_inv.grand_total THEN 'Paid' ELSE 'Partially Paid' END,
        v_uid, COALESCE(NULLIF(btrim(p_recorded_by), ''), 'Finance Team')
      );
    END IF;
  END IF;

  RETURN v_txn;
END;
$$;

REVOKE ALL ON FUNCTION public.record_financial_payment_atomic(text, text, numeric, text, text, text, uuid, uuid, uuid, uuid, text, text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_financial_payment_atomic(text, text, numeric, text, text, text, uuid, uuid, uuid, uuid, text, text, date, text, text) TO authenticated, service_role;
