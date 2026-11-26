-- Phase 4.1 Hotfix: Fix PL/pgSQL NO_DATA_FOUND overwriting v_prev_client_qty with NULL in process_goods_receipt

CREATE OR REPLACE FUNCTION public.process_goods_receipt(
  p_po_number text,
  p_received_by text,
  p_items jsonb,
  p_idempotency_key text DEFAULT NULL,
  p_allow_excess boolean DEFAULT false,
  p_inspection_notes text DEFAULT NULL,
  p_remarks text DEFAULT NULL,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS public.goods_receipts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_po public.purchase_orders%ROWTYPE;
  v_existing public.goods_receipts%ROWTYPE;
  v_grn public.goods_receipts%ROWTYPE;
  v_grn_number text;
  v_item jsonb;
  v_po_item public.purchase_order_items%ROWTYPE;
  v_prev_received integer;
  v_recv integer;
  v_acc integer;
  v_rej integer;
  v_dmg integer;
  v_short integer;
  v_excess integer;
  v_grn_item_id uuid;
  v_all_delivered boolean := true;
  v_any_received boolean := false;
  v_po_status text;
  v_total_accepted integer;
  v_prev_client_qty integer;
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  IF btrim(COALESCE(p_idempotency_key, '')) <> '' THEN
    SELECT * INTO v_existing
    FROM public.goods_receipts
    WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_orders
  WHERE po_number = p_po_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_number USING ERRCODE = '23503';
  END IF;

  IF v_po.status IN ('Draft', 'Cancelled') THEN
    RAISE EXCEPTION 'Cannot receive goods for a % Purchase Order', v_po.status USING ERRCODE = '22023';
  END IF;

  v_grn_number := public.allocate_document_number('GRN', NULL);

  INSERT INTO public.goods_receipts (
    grn_number, purchase_order_id, po_number, order_id, client_id, vendor_id,
    received_by, status, inspection_notes, remarks, attachments, idempotency_key, created_by
  ) VALUES (
    v_grn_number, v_po.id, v_po.po_number, v_po.order_id, v_po.client_id, v_po.vendor_id,
    COALESCE(NULLIF(btrim(p_received_by), ''), 'Warehouse Team'), 'Received',
    p_inspection_notes, p_remarks, COALESCE(p_attachments, '[]'::jsonb),
    NULLIF(btrim(COALESCE(p_idempotency_key, '')), ''), v_uid
  )
  RETURNING * INTO v_grn;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
  LOOP
    SELECT * INTO v_po_item
    FROM public.purchase_order_items
    WHERE purchase_order_id = v_po.id
      AND sub_order_id = (v_item->>'sub_order_id')
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PO item % not found on %', COALESCE(v_item->>'sub_order_id', ''), p_po_number USING ERRCODE = '23503';
    END IF;

    SELECT COALESCE(SUM(gri.received_qty), 0) INTO v_prev_received
    FROM public.goods_receipt_items gri
    JOIN public.goods_receipts gr ON gr.id = gri.goods_receipt_id
    WHERE gri.purchase_order_item_id = v_po_item.id
      AND gr.status <> 'Cancelled';

    v_recv := GREATEST(0, COALESCE((v_item->>'received_qty')::integer, 0));
    v_acc := GREATEST(0, COALESCE((v_item->>'accepted_qty')::integer, v_recv));
    v_rej := GREATEST(0, COALESCE((v_item->>'rejected_qty')::integer, 0));
    v_dmg := GREATEST(0, COALESCE((v_item->>'damaged_qty')::integer, 0));

    IF v_acc + v_rej + v_dmg > v_recv THEN
      RAISE EXCEPTION 'Accepted + rejected + damaged quantities cannot exceed received quantity for %', v_po_item.item_name USING ERRCODE = '22023';
    END IF;

    IF NOT p_allow_excess AND (v_prev_received + v_recv > v_po_item.qty) THEN
      RAISE EXCEPTION 'Received quantity (%) exceeds remaining PO quantity (%) for %', v_recv, GREATEST(0, v_po_item.qty - v_prev_received), v_po_item.item_name USING ERRCODE = '22023';
    END IF;

    v_short := GREATEST(0, v_po_item.qty - (v_prev_received + v_recv));
    v_excess := GREATEST(0, (v_prev_received + v_recv) - v_po_item.qty);

    INSERT INTO public.goods_receipt_items (
      goods_receipt_id, purchase_order_item_id, sub_order_id, master_catalogue_item_id,
      product_code, sku, product_name, ordered_qty, previously_received_qty,
      received_qty, accepted_qty, rejected_qty, damaged_qty, shortage_qty, excess_qty,
      batch_number, serial_number, expiry_date, inspection_notes, return_requested, return_reason
    ) VALUES (
      v_grn.id, v_po_item.id, v_po_item.sub_order_id, v_po_item.master_catalogue_item_id,
      v_po_item.product_code, v_po_item.sku, v_po_item.item_name, v_po_item.qty, v_prev_received,
      v_recv, v_acc, v_rej, v_dmg, v_short, v_excess,
      v_item->>'batch_number', v_item->>'serial_number',
      NULLIF(v_item->>'expiry_date', '')::date,
      v_item->>'inspection_notes',
      COALESCE((v_item->>'return_requested')::boolean, false),
      v_item->>'return_reason'
    )
    RETURNING id INTO v_grn_item_id;

    -- Record accepted goods in client inventory & inventory_transactions (NEVER deduct vendor stock again!)
    IF v_acc > 0 THEN
      v_any_received := true;
      v_prev_client_qty := 0;
      IF v_po.client_id IS NOT NULL THEN
        SELECT COALESCE(
          (SELECT quantity FROM public.client_inventory_items WHERE source_key = 'grn_' || v_po_item.sub_order_id),
          0
        ) INTO v_prev_client_qty;

        INSERT INTO public.client_inventory_items (
          client_id, master_catalogue_item_id, goods_receipt_item_id, source_key,
          asset_id, name, category, serial_number, quantity
        ) VALUES (
          v_po.client_id, v_po_item.master_catalogue_item_id, v_grn_item_id,
          'grn_' || v_po_item.sub_order_id,
          COALESCE(v_po_item.product_code, v_po_item.sub_order_id),
          v_po_item.item_name, v_po_item.category, v_item->>'serial_number', v_acc
        )
        ON CONFLICT (source_key) DO UPDATE
        SET quantity = public.client_inventory_items.quantity + EXCLUDED.quantity,
            goods_receipt_item_id = EXCLUDED.goods_receipt_item_id,
            updated_at = now();
      END IF;

      INSERT INTO public.inventory_transactions (
        transaction_reference, idempotency_key, transaction_type,
        master_catalogue_item_id, master_product_code, product_name,
        vendor_id, vendor_name, client_id, purchase_order_id, purchase_order_item_id,
        goods_receipt_id, goods_receipt_item_id, field, quantity, previous_quantity, new_quantity,
        performed_by, reason, document_reference
      ) VALUES (
        'TXN-' || v_grn_number || '-' || v_po_item.sub_order_id,
        'grn_acc_' || v_grn_item_id::text,
        'GRN Accepted',
        v_po_item.master_catalogue_item_id, COALESCE(v_po_item.product_code, v_po_item.sub_order_id), v_po_item.item_name,
        v_po.vendor_id, v_po.vendor_name, v_po.client_id, v_po.id, v_po_item.id,
        v_grn.id, v_grn_item_id, 'clientInventory', v_acc, v_prev_client_qty, v_prev_client_qty + v_acc,
        COALESCE(NULLIF(btrim(p_received_by), ''), 'Warehouse Team'),
        'Accepted goods via ' || v_grn_number,
        v_grn_number
      ) ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    -- Update PO item status based on cumulative accepted quantity
    SELECT COALESCE(SUM(gri.accepted_qty), 0) INTO v_total_accepted
    FROM public.goods_receipt_items gri
    JOIN public.goods_receipts gr ON gr.id = gri.goods_receipt_id
    WHERE gri.purchase_order_item_id = v_po_item.id AND gr.status <> 'Cancelled';

    UPDATE public.purchase_order_items
    SET item_status = CASE
          WHEN v_total_accepted >= v_po_item.qty THEN 'Delivered'
          WHEN v_total_accepted > 0 THEN 'Partially Delivered'
          ELSE item_status
        END,
        updated_at = now()
    WHERE id = v_po_item.id;
  END LOOP;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE purchase_order_id = v_po.id
      AND lower(COALESCE(item_status, '')) NOT IN ('delivered', 'cancelled')
  ) INTO v_all_delivered;

  v_po_status := CASE
    WHEN v_all_delivered THEN 'Delivered'
    WHEN v_any_received THEN 'Partially Shipped'
    ELSE v_po.status
  END;

  UPDATE public.goods_receipts
  SET status = CASE WHEN v_all_delivered THEN 'Received' WHEN v_any_received THEN 'Partially Received' ELSE 'Rejected' END,
      updated_at = now()
  WHERE id = v_grn.id
  RETURNING * INTO v_grn;

  INSERT INTO public.goods_receipt_status_history (
    goods_receipt_id, new_status, note_text, actor_user_id, actor_name
  ) VALUES (
    v_grn.id, v_grn.status, 'GRN ' || v_grn_number || ' processed for ' || v_po.po_number,
    v_uid, COALESCE(NULLIF(btrim(p_received_by), ''), 'Warehouse Team')
  );

  IF v_po_status <> v_po.status THEN
    UPDATE public.purchase_orders
    SET status = v_po_status, updated_by = v_uid, updated_at = now()
    WHERE id = v_po.id;

    INSERT INTO public.purchase_order_status_history (
      purchase_order_id, kind, previous_status, new_status, note_text, actor_user_id, actor_name, initials
    ) VALUES (
      v_po.id, 'status-change', v_po.status, v_po_status,
      'PO status updated via ' || v_grn_number || '.',
      v_uid, 'System', 'SY'
    );
  END IF;

  RETURN v_grn;
END;
$$;

REVOKE ALL ON FUNCTION public.process_goods_receipt(text, text, jsonb, text, boolean, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_goods_receipt(text, text, jsonb, text, boolean, text, text, jsonb) TO authenticated;

