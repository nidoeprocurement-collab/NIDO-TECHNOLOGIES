-- Phase 4.2: RBAC Corrections & Financial RLS/RPC Hardening
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)

-- ----------------------------------------------------------------------------
-- 1. System Administrator Role Alignment (IT/Platform Admin, NOT Full Ops)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_sys_admin_role_id uuid;
BEGIN
  SELECT id INTO v_sys_admin_role_id
  FROM public.nido_roles
  WHERE name = 'System Administrator'
  LIMIT 1;

  IF v_sys_admin_role_id IS NOT NULL THEN
    -- Remove any unintended financial/sales module access if present
    DELETE FROM public.nido_role_permissions
    WHERE role_id = v_sys_admin_role_id
      AND module_key IN ('sales', 'credit_notes', 'debit_notes', 'finance');

    -- Restrict operational & financial modules to View-Only (no create, edit, delete, approve)
    UPDATE public.nido_role_permissions
    SET can_view = true,
        can_create = false,
        can_edit = false,
        can_delete = false,
        can_approve = false,
        updated_at = now()
    WHERE role_id = v_sys_admin_role_id
      AND module_key IN (
        'vendors',
        'clients',
        'bills',
        'invoices',
        'orders',
        'client_orders',
        'approvals',
        'purchase_orders',
        'purchases',
        'audit_logs',
        'reports',
        'dashboard',
        'login_history',
        'data_import_export'
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Granular Financial Table RLS Policies (Remove app.is_nido_internal()-only
--    and remove nonexistent 'finance' module references)
-- ----------------------------------------------------------------------------

-- A. Vendor Bills (Internal AP only - NEVER visible to Client Portal)
DROP POLICY IF EXISTS vendor_bills_internal ON public.vendor_bills;
DROP POLICY IF EXISTS vendor_bills_select ON public.vendor_bills;
DROP POLICY IF EXISTS vendor_bills_insert ON public.vendor_bills;
DROP POLICY IF EXISTS vendor_bills_update ON public.vendor_bills;
DROP POLICY IF EXISTS vendor_bills_delete ON public.vendor_bills;

CREATE POLICY vendor_bills_select ON public.vendor_bills
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'view') OR app.has_nido_permission('purchases', 'view'))
  );

CREATE POLICY vendor_bills_insert ON public.vendor_bills
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('bills', 'create')
  );

CREATE POLICY vendor_bills_update ON public.vendor_bills
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve'))
  );

CREATE POLICY vendor_bills_delete ON public.vendor_bills
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('bills', 'delete')
  );

-- B. Vendor Bill Items
DROP POLICY IF EXISTS vendor_bill_items_internal ON public.vendor_bill_items;
DROP POLICY IF EXISTS vendor_bill_items_select ON public.vendor_bill_items;
DROP POLICY IF EXISTS vendor_bill_items_insert ON public.vendor_bill_items;
DROP POLICY IF EXISTS vendor_bill_items_update ON public.vendor_bill_items;
DROP POLICY IF EXISTS vendor_bill_items_delete ON public.vendor_bill_items;

CREATE POLICY vendor_bill_items_select ON public.vendor_bill_items
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'view') OR app.has_nido_permission('purchases', 'view'))
  );

CREATE POLICY vendor_bill_items_insert ON public.vendor_bill_items
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('bills', 'create')
  );

CREATE POLICY vendor_bill_items_update ON public.vendor_bill_items
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve'))
  );

CREATE POLICY vendor_bill_items_delete ON public.vendor_bill_items
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('bills', 'delete')
  );

-- C. Client Invoices (Internal AR + Client Portal SELECT own client_id)
DROP POLICY IF EXISTS client_invoices_select ON public.client_invoices;
DROP POLICY IF EXISTS client_invoices_write ON public.client_invoices;
DROP POLICY IF EXISTS client_invoices_insert ON public.client_invoices;
DROP POLICY IF EXISTS client_invoices_update ON public.client_invoices;
DROP POLICY IF EXISTS client_invoices_delete ON public.client_invoices;

CREATE POLICY client_invoices_select ON public.client_invoices
  FOR SELECT TO authenticated
  USING (
    (
      app.is_nido_internal()
      AND (app.has_nido_permission('invoices', 'view') OR app.has_nido_permission('sales', 'view'))
    )
    OR client_id = app.current_client_id()
  );

CREATE POLICY client_invoices_insert ON public.client_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('invoices', 'create')
  );

CREATE POLICY client_invoices_update ON public.client_invoices
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve'))
  );

CREATE POLICY client_invoices_delete ON public.client_invoices
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('invoices', 'delete')
  );

-- D. Client Invoice Items
DROP POLICY IF EXISTS client_invoice_items_select ON public.client_invoice_items;
DROP POLICY IF EXISTS client_invoice_items_write ON public.client_invoice_items;
DROP POLICY IF EXISTS client_invoice_items_insert ON public.client_invoice_items;
DROP POLICY IF EXISTS client_invoice_items_update ON public.client_invoice_items;
DROP POLICY IF EXISTS client_invoice_items_delete ON public.client_invoice_items;

CREATE POLICY client_invoice_items_select ON public.client_invoice_items
  FOR SELECT TO authenticated
  USING (
    (
      app.is_nido_internal()
      AND (app.has_nido_permission('invoices', 'view') OR app.has_nido_permission('sales', 'view'))
    )
    OR EXISTS (
      SELECT 1 FROM public.client_invoices ci
      WHERE ci.id = invoice_id AND ci.client_id = app.current_client_id()
    )
  );

CREATE POLICY client_invoice_items_insert ON public.client_invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('invoices', 'create')
  );

CREATE POLICY client_invoice_items_update ON public.client_invoice_items
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve'))
  );

CREATE POLICY client_invoice_items_delete ON public.client_invoice_items
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('invoices', 'delete')
  );

-- E. Credit Notes & Credit Note Items
DROP POLICY IF EXISTS credit_notes_select ON public.credit_notes;
DROP POLICY IF EXISTS credit_notes_write ON public.credit_notes;
DROP POLICY IF EXISTS credit_notes_insert ON public.credit_notes;
DROP POLICY IF EXISTS credit_notes_update ON public.credit_notes;
DROP POLICY IF EXISTS credit_notes_delete ON public.credit_notes;

CREATE POLICY credit_notes_select ON public.credit_notes
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('credit_notes', 'view'))
    OR client_id = app.current_client_id()
  );

CREATE POLICY credit_notes_insert ON public.credit_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('credit_notes', 'create')
  );

CREATE POLICY credit_notes_update ON public.credit_notes
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('credit_notes', 'edit') OR app.has_nido_permission('credit_notes', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('credit_notes', 'edit') OR app.has_nido_permission('credit_notes', 'approve'))
  );

CREATE POLICY credit_notes_delete ON public.credit_notes
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('credit_notes', 'delete')
  );

DROP POLICY IF EXISTS credit_note_items_rw ON public.credit_note_items;
DROP POLICY IF EXISTS credit_note_items_select ON public.credit_note_items;
DROP POLICY IF EXISTS credit_note_items_insert ON public.credit_note_items;
DROP POLICY IF EXISTS credit_note_items_update ON public.credit_note_items;
DROP POLICY IF EXISTS credit_note_items_delete ON public.credit_note_items;

CREATE POLICY credit_note_items_select ON public.credit_note_items
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('credit_notes', 'view'))
    OR EXISTS (
      SELECT 1 FROM public.credit_notes cn
      WHERE cn.id = credit_note_id AND cn.client_id = app.current_client_id()
    )
  );

CREATE POLICY credit_note_items_insert ON public.credit_note_items
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('credit_notes', 'create')
  );

CREATE POLICY credit_note_items_update ON public.credit_note_items
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('credit_notes', 'edit') OR app.has_nido_permission('credit_notes', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('credit_notes', 'edit') OR app.has_nido_permission('credit_notes', 'approve'))
  );

CREATE POLICY credit_note_items_delete ON public.credit_note_items
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('credit_notes', 'delete')
  );

-- F. Debit Notes & Debit Note Items
DROP POLICY IF EXISTS debit_notes_select ON public.debit_notes;
DROP POLICY IF EXISTS debit_notes_write ON public.debit_notes;
DROP POLICY IF EXISTS debit_notes_insert ON public.debit_notes;
DROP POLICY IF EXISTS debit_notes_update ON public.debit_notes;
DROP POLICY IF EXISTS debit_notes_delete ON public.debit_notes;

CREATE POLICY debit_notes_select ON public.debit_notes
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('debit_notes', 'view'))
    OR client_id = app.current_client_id()
  );

CREATE POLICY debit_notes_insert ON public.debit_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('debit_notes', 'create')
  );

CREATE POLICY debit_notes_update ON public.debit_notes
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('debit_notes', 'edit') OR app.has_nido_permission('debit_notes', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('debit_notes', 'edit') OR app.has_nido_permission('debit_notes', 'approve'))
  );

CREATE POLICY debit_notes_delete ON public.debit_notes
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('debit_notes', 'delete')
  );

DROP POLICY IF EXISTS debit_note_items_rw ON public.debit_note_items;
DROP POLICY IF EXISTS debit_note_items_select ON public.debit_note_items;
DROP POLICY IF EXISTS debit_note_items_insert ON public.debit_note_items;
DROP POLICY IF EXISTS debit_note_items_update ON public.debit_note_items;
DROP POLICY IF EXISTS debit_note_items_delete ON public.debit_note_items;

CREATE POLICY debit_note_items_select ON public.debit_note_items
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('debit_notes', 'view'))
    OR EXISTS (
      SELECT 1 FROM public.debit_notes dn
      WHERE dn.id = debit_note_id AND dn.client_id = app.current_client_id()
    )
  );

CREATE POLICY debit_note_items_insert ON public.debit_note_items
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND app.has_nido_permission('debit_notes', 'create')
  );

CREATE POLICY debit_note_items_update ON public.debit_note_items
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('debit_notes', 'edit') OR app.has_nido_permission('debit_notes', 'approve'))
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (app.has_nido_permission('debit_notes', 'edit') OR app.has_nido_permission('debit_notes', 'approve'))
  );

CREATE POLICY debit_note_items_delete ON public.debit_note_items
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND app.has_nido_permission('debit_notes', 'delete')
  );

-- G. Financial Transactions
DROP POLICY IF EXISTS financial_transactions_select ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_write ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_insert ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_update ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_delete ON public.financial_transactions;

CREATE POLICY financial_transactions_select ON public.financial_transactions
  FOR SELECT TO authenticated
  USING (
    (
      app.is_nido_internal()
      AND (
        (ledger_type = 'payable' AND (app.has_nido_permission('bills', 'view') OR app.has_nido_permission('purchases', 'view')))
        OR (ledger_type = 'receivable' AND (app.has_nido_permission('invoices', 'view') OR app.has_nido_permission('sales', 'view')))
      )
    )
    OR (ledger_type = 'receivable' AND client_id = app.current_client_id())
  );

CREATE POLICY financial_transactions_insert ON public.financial_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      (ledger_type = 'payable' AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('purchases', 'edit')))
      OR (ledger_type = 'receivable' AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('sales', 'edit')))
    )
  );

CREATE POLICY financial_transactions_update ON public.financial_transactions
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      (ledger_type = 'payable' AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve') OR app.has_nido_permission('purchases', 'edit')))
      OR (ledger_type = 'receivable' AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve') OR app.has_nido_permission('sales', 'edit')))
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      (ledger_type = 'payable' AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve') OR app.has_nido_permission('purchases', 'edit')))
      OR (ledger_type = 'receivable' AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve') OR app.has_nido_permission('sales', 'edit')))
    )
  );

CREATE POLICY financial_transactions_delete ON public.financial_transactions
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'delete') OR app.has_nido_permission('invoices', 'delete'))
  );

-- H. Payment Allocations
DROP POLICY IF EXISTS payment_allocations_rw ON public.payment_allocations;
DROP POLICY IF EXISTS payment_allocations_select ON public.payment_allocations;
DROP POLICY IF EXISTS payment_allocations_insert ON public.payment_allocations;
DROP POLICY IF EXISTS payment_allocations_update ON public.payment_allocations;
DROP POLICY IF EXISTS payment_allocations_delete ON public.payment_allocations;

CREATE POLICY payment_allocations_select ON public.payment_allocations
  FOR SELECT TO authenticated
  USING (
    (
      app.is_nido_internal()
      AND (
        (bill_id IS NOT NULL AND (app.has_nido_permission('bills', 'view') OR app.has_nido_permission('purchases', 'view')))
        OR (invoice_id IS NOT NULL AND (app.has_nido_permission('invoices', 'view') OR app.has_nido_permission('sales', 'view')))
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.client_invoices ci
      WHERE ci.id = invoice_id AND ci.client_id = app.current_client_id()
    )
  );

CREATE POLICY payment_allocations_insert ON public.payment_allocations
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      (bill_id IS NOT NULL AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('purchases', 'edit')))
      OR (invoice_id IS NOT NULL AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('sales', 'edit')))
    )
  );

CREATE POLICY payment_allocations_update ON public.payment_allocations
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      (bill_id IS NOT NULL AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve') OR app.has_nido_permission('purchases', 'edit')))
      OR (invoice_id IS NOT NULL AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve') OR app.has_nido_permission('sales', 'edit')))
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      (bill_id IS NOT NULL AND (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('bills', 'approve') OR app.has_nido_permission('purchases', 'edit')))
      OR (invoice_id IS NOT NULL AND (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('invoices', 'approve') OR app.has_nido_permission('sales', 'edit')))
    )
  );

CREATE POLICY payment_allocations_delete ON public.payment_allocations
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (app.has_nido_permission('bills', 'delete') OR app.has_nido_permission('invoices', 'delete'))
  );

-- I. Financial Document Status History (append-only for authorized finance roles)
DROP POLICY IF EXISTS fin_doc_history_rw ON public.financial_document_status_history;
DROP POLICY IF EXISTS fin_doc_history_select ON public.financial_document_status_history;
DROP POLICY IF EXISTS fin_doc_history_insert ON public.financial_document_status_history;

CREATE POLICY fin_doc_history_select ON public.financial_document_status_history
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('bills', 'view')
      OR app.has_nido_permission('invoices', 'view')
      OR app.has_nido_permission('credit_notes', 'view')
      OR app.has_nido_permission('debit_notes', 'view')
      OR app.has_nido_permission('sales', 'view')
      OR app.has_nido_permission('purchases', 'view')
    )
  );

CREATE POLICY fin_doc_history_insert ON public.financial_document_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('bills', 'edit')
      OR app.has_nido_permission('invoices', 'edit')
      OR app.has_nido_permission('credit_notes', 'edit')
      OR app.has_nido_permission('debit_notes', 'edit')
      OR app.has_nido_permission('sales', 'edit')
      OR app.has_nido_permission('purchases', 'edit')
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Harden SECURITY DEFINER RPC: record_financial_payment_atomic
--    Enforce module-level permission in addition to app.is_nido_internal()
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

  IF p_ledger_type = 'payable' OR p_bill_id IS NOT NULL THEN
    IF NOT (app.has_nido_permission('bills', 'edit') OR app.has_nido_permission('purchases', 'edit')) THEN
      RAISE EXCEPTION 'Forbidden: payable payment requires bills or purchases edit permission' USING ERRCODE = '42501';
    END IF;
  ELSIF p_ledger_type = 'receivable' OR p_invoice_id IS NOT NULL THEN
    IF NOT (app.has_nido_permission('invoices', 'edit') OR app.has_nido_permission('sales', 'edit')) THEN
      RAISE EXCEPTION 'Forbidden: receivable payment requires invoices or sales edit permission' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid ledger_type: %', COALESCE(p_ledger_type, '') USING ERRCODE = '22023';
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

