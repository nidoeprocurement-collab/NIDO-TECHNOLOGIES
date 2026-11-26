-- ============================================================================
-- NIDO Phase 3 – Wave 2.5: Dashboards, Reports, Audit Logs & Notifications
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Append-Only Business Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NULL UNIQUE,
  module text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  actor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE SET NULL,
  previous_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NULL,
  is_internal_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module_created ON public.audit_logs (module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_created ON public.audit_logs (client_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Notifications, Preferences & Delivery Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NULL UNIQUE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  notification_type text NOT NULL DEFAULT 'info',
  module text NOT NULL,
  entity_reference text NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  action_link text NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  in_app_enabled boolean NOT NULL DEFAULT true,
  category_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  recipient_address text NULL,
  template_key text NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  retry_count integer NOT NULL DEFAULT 0,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Row-Level Security (Default-Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.notification_preferences FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.notification_delivery_logs FROM PUBLIC, anon;

-- Append-only audit_logs: SELECT and INSERT only (NO UPDATE, NO DELETE)
GRANT SELECT, INSERT ON TABLE public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.notification_delivery_logs TO authenticated;

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    OR (client_id = app.current_client_id() AND is_internal_only = false)
  );

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    OR (client_id = app.current_client_id() AND is_internal_only = false)
  );

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (app.is_nido_internal() OR recipient_user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_rw ON public.notification_preferences;
CREATE POLICY notification_preferences_rw ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_delivery_logs_select ON public.notification_delivery_logs;
CREATE POLICY notification_delivery_logs_select ON public.notification_delivery_logs
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    OR EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_id AND n.recipient_user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Server-Side Dashboard, Report, Audit & Notification RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_client_id uuid DEFAULT NULL,
  p_period text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_internal boolean := app.is_nido_internal();
  v_client_id uuid;
  v_since timestamptz := NULL;
  v_orders RECORD;
  v_pos RECORD;
  v_inv RECORD;
  v_bills RECORD;
  v_vendors_count integer := 0;
  v_clients_count integer := 0;
  v_grn_count integer := 0;
  v_pending_deliveries integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_is_internal THEN
    v_client_id := p_client_id;
  ELSE
    v_client_id := app.current_client_id();
    IF p_client_id IS NOT NULL AND p_client_id <> v_client_id THEN
      RAISE EXCEPTION 'Forbidden client scope' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_period = 'month' THEN
    v_since := date_trunc('month', now());
  ELSIF p_period = 'quarter' THEN
    v_since := date_trunc('month', now()) - interval '2 months';
  ELSIF p_period = 'year' THEN
    v_since := date_trunc('year', now());
  END IF;

  SELECT
    COUNT(*)::integer AS total_orders,
    COUNT(*) FILTER (WHERE status IN ('Processing', 'Pending Shipping', 'Partially Shipped', 'Shipped', 'Partially Delivered'))::integer AS pending_orders,
    COUNT(*) FILTER (WHERE approval_status = 'Approved')::integer AS approved_orders,
    COUNT(*) FILTER (WHERE approval_status = 'Rejected')::integer AS rejected_orders,
    COUNT(*) FILTER (WHERE status IN ('Delivered', 'Completed'))::integer AS completed_orders,
    COALESCE(SUM(total_amount) FILTER (WHERE status <> 'Cancelled'), 0)::numeric(14, 2) AS total_spend
  INTO v_orders
  FROM public.procurement_orders
  WHERE (v_client_id IS NULL OR client_id = v_client_id)
    AND (v_since IS NULL OR created_at >= v_since);

  SELECT
    COUNT(*)::integer AS outstanding_count,
    COALESCE(SUM(outstanding_amount), 0)::numeric(14, 2) AS outstanding_amount
  INTO v_inv
  FROM public.client_invoices
  WHERE (v_client_id IS NULL OR client_id = v_client_id)
    AND status IN ('Sent', 'Pending', 'Partially Paid', 'Overdue');

  IF v_is_internal THEN
    SELECT
      COUNT(*)::integer AS total_pos,
      COALESCE(SUM(grand_total) FILTER (WHERE status <> 'Cancelled'), 0)::numeric(14, 2) AS total_po_value
    INTO v_pos
    FROM public.purchase_orders
    WHERE (v_client_id IS NULL OR client_id = v_client_id)
      AND (v_since IS NULL OR created_at >= v_since);

    SELECT
      COUNT(*)::integer AS outstanding_count,
      COALESCE(SUM(outstanding_balance), 0)::numeric(14, 2) AS outstanding_amount
    INTO v_bills
    FROM public.vendor_bills
    WHERE status NOT IN ('Paid', 'Cancelled');

    SELECT COUNT(*)::integer INTO v_vendors_count FROM public.vendors WHERE archived = false AND status = 'Active';
    SELECT COUNT(*)::integer INTO v_clients_count FROM public.client_organizations;
    SELECT COUNT(*)::integer INTO v_grn_count FROM public.goods_receipts WHERE status <> 'Cancelled';
    SELECT COUNT(*)::integer INTO v_pending_deliveries FROM public.delivery_tracking WHERE delivery_status NOT IN ('Delivered', 'Cancelled');
  ELSE
    v_pos := ROW(0, 0::numeric(14, 2));
    v_bills := ROW(0, 0::numeric(14, 2));
    SELECT COUNT(*)::integer INTO v_pending_deliveries
    FROM public.delivery_tracking
    WHERE client_id = v_client_id AND delivery_status NOT IN ('Delivered', 'Cancelled');
  END IF;

  RETURN jsonb_build_object(
    'total_orders', COALESCE(v_orders.total_orders, 0),
    'pending_orders', COALESCE(v_orders.pending_orders, 0),
    'approved_orders', COALESCE(v_orders.approved_orders, 0),
    'rejected_orders', COALESCE(v_orders.rejected_orders, 0),
    'completed_orders', COALESCE(v_orders.completed_orders, 0),
    'total_procurement_spend', COALESCE(v_orders.total_spend, 0),
    'outstanding_invoices_count', COALESCE(v_inv.outstanding_count, 0),
    'outstanding_invoices_amount', COALESCE(v_inv.outstanding_amount, 0),
    'total_purchase_orders', COALESCE(v_pos.total_pos, 0),
    'total_po_value', COALESCE(v_pos.total_po_value, 0),
    'outstanding_bills_count', COALESCE(v_bills.outstanding_count, 0),
    'outstanding_bills_amount', COALESCE(v_bills.outstanding_amount, 0),
    'active_vendors', v_vendors_count,
    'total_clients', v_clients_count,
    'total_grns', v_grn_count,
    'pending_deliveries', v_pending_deliveries
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.append_audit_log(
  p_module text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_actor_name text,
  p_client_id uuid DEFAULT NULL,
  p_previous_values jsonb DEFAULT '{}'::jsonb,
  p_new_values jsonb DEFAULT '{}'::jsonb,
  p_reason text DEFAULT NULL,
  p_is_internal_only boolean DEFAULT false,
  p_event_id text DEFAULT NULL
)
RETURNS public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_internal boolean := app.is_nido_internal();
  v_client_id uuid;
  v_row public.audit_logs%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_is_internal THEN
    v_client_id := p_client_id;
  ELSE
    v_client_id := app.current_client_id();
    IF p_is_internal_only THEN
      RAISE EXCEPTION 'Forbidden: cannot write internal-only audit log' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    event_id, module, action, entity_type, entity_id, actor_id, actor_name,
    client_id, previous_values, new_values, reason, is_internal_only
  ) VALUES (
    NULLIF(btrim(COALESCE(p_event_id, '')), ''),
    p_module, p_action, p_entity_type, p_entity_id, v_uid,
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'System'),
    v_client_id,
    COALESCE(p_previous_values, '{}'::jsonb) - 'password' - 'token' - 'access_token' - 'refresh_token' - 'api_key',
    COALESCE(p_new_values, '{}'::jsonb) - 'password' - 'token' - 'access_token' - 'refresh_token' - 'api_key',
    p_reason,
    CASE WHEN v_is_internal THEN COALESCE(p_is_internal_only, false) ELSE false END
  )
  ON CONFLICT (event_id) DO UPDATE SET reason = EXCLUDED.reason
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_recipient_user_id uuid,
  p_title text,
  p_description text,
  p_module text,
  p_notification_type text DEFAULT 'info',
  p_entity_reference text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_action_link text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_dedupe_key text DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_notif public.notifications%ROWTYPE;
  v_prefs public.notification_preferences%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT (app.is_nido_internal() OR p_recipient_user_id = v_uid) THEN
    RAISE EXCEPTION 'Forbidden notification target' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.notifications (
    dedupe_key, recipient_user_id, client_id, title, description,
    notification_type, module, entity_reference, priority, action_link
  ) VALUES (
    NULLIF(btrim(COALESCE(p_dedupe_key, '')), ''),
    p_recipient_user_id, p_client_id, p_title, COALESCE(p_description, ''),
    COALESCE(p_notification_type, 'info'), p_module, p_entity_reference,
    COALESCE(p_priority, 'normal'), p_action_link
  )
  ON CONFLICT (dedupe_key) DO UPDATE SET title = EXCLUDED.title
  RETURNING * INTO v_notif;

  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = p_recipient_user_id;
  IF COALESCE(v_prefs.email_enabled, true) THEN
    INSERT INTO public.notification_delivery_logs (
      notification_id, channel, template_key, status
    ) VALUES (
      v_notif.id, 'email', p_module || '_' || COALESCE(p_notification_type, 'info'), 'queued'
    );
  END IF;

  RETURN v_notif;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.append_audit_log(text, text, text, text, text, uuid, jsonb, jsonb, text, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_user_notification(uuid, text, text, text, text, text, text, text, uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_audit_log(text, text, text, text, text, uuid, jsonb, jsonb, text, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_user_notification(uuid, text, text, text, text, text, text, text, uuid, text) TO authenticated, service_role;
