import { pool } from "./db.js";
import { DEFAULT_TEMPLATES } from "./templateDefaults.js";

let migrated = false;

export async function migrate() {
  if (migrated) return;
  if (!pool) {
    throw new Error(
      "DATABASE_URL or SUPABASE_DB_URL is not set — database features are disabled.",
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INT PRIMARY KEY DEFAULT 1,
      provider TEXT NOT NULL DEFAULT 'resend',
      sender_name TEXT NOT NULL DEFAULT 'NIDO Tech',
      sender_email TEXT NOT NULL DEFAULT '',
      reply_to_email TEXT NOT NULL DEFAULT '',
      support_email TEXT NOT NULL DEFAULT '',
      company_logo_url TEXT NOT NULL DEFAULT '',
      email_footer TEXT NOT NULL DEFAULT 'Sent by NIDO Tech Procurement Platform',
      api_key_encrypted TEXT,
      default_signature TEXT NOT NULL DEFAULT '',
      default_language TEXT NOT NULL DEFAULT 'English (India)',
      default_timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata (IST, GMT+5:30)',
      rate_limit_per_hour INT NOT NULL DEFAULT 500,
      retry_count INT NOT NULL DEFAULT 3,
      retry_interval_seconds INT NOT NULL DEFAULT 60,
      enabled BOOLEAN NOT NULL DEFAULT true,
      disabled_types JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by TEXT,
      CONSTRAINT email_config_single_row CHECK (id = 1)
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      subject TEXT NOT NULL,
      html_body TEXT NOT NULL,
      text_body TEXT NOT NULL DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT true,
      version INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS email_template_versions (
      id SERIAL PRIMARY KEY,
      template_id INT NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
      version INT NOT NULL,
      subject TEXT NOT NULL,
      html_body TEXT NOT NULL,
      text_body TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS email_queue (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_body TEXT NOT NULL,
      text_body TEXT NOT NULL DEFAULT '',
      template_key TEXT,
      variables JSONB NOT NULL DEFAULT '{}',
      attachments JSONB NOT NULL DEFAULT '[]',
      trigger_module TEXT NOT NULL DEFAULT 'general',
      sent_by TEXT NOT NULL DEFAULT 'system',
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','sending','sent','failed','cancelled')),
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 3,
      provider TEXT NOT NULL DEFAULT 'resend',
      provider_message_id TEXT,
      last_error TEXT,
      dedupe_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      sent_at TIMESTAMPTZ
    );

    CREATE UNIQUE INDEX IF NOT EXISTS email_queue_dedupe_key_idx
      ON email_queue (dedupe_key) WHERE dedupe_key IS NOT NULL;
    CREATE INDEX IF NOT EXISTS email_queue_status_idx ON email_queue (status);
    CREATE INDEX IF NOT EXISTS email_queue_created_at_idx ON email_queue (created_at DESC);

    -- Centralized approval workflow engine. Workflow configuration is versioned
    -- so requests always retain the exact rules that created them.
    CREATE TABLE IF NOT EXISTS approval_workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      module TEXT NOT NULL,
      workflow_type TEXT NOT NULL DEFAULT 'Standard',
      status TEXT NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft','Active','Inactive')),
      current_version INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by TEXT NOT NULL DEFAULT 'system',
      updated_by TEXT NOT NULL DEFAULT 'system'
    );
    ALTER TABLE approval_workflows ADD COLUMN IF NOT EXISTS trigger TEXT NOT NULL DEFAULT 'Manual submission';

    CREATE TABLE IF NOT EXISTS approval_workflow_versions (
      id BIGSERIAL PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
      version INT NOT NULL,
      snapshot JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by TEXT NOT NULL DEFAULT 'system',
      UNIQUE (workflow_id, version)
    );

    CREATE TABLE IF NOT EXISTS approval_workflow_conditions (
      id BIGSERIAL PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
      version INT NOT NULL,
      position INT NOT NULL,
      join_operator TEXT NOT NULL DEFAULT 'AND' CHECK (join_operator IN ('AND','OR')),
      field TEXT NOT NULL,
      operator TEXT NOT NULL,
      value JSONB NOT NULL DEFAULT 'null'
    );

    CREATE TABLE IF NOT EXISTS approval_workflow_levels (
      id BIGSERIAL PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
      version INT NOT NULL,
      level_number INT NOT NULL,
      approver_type TEXT NOT NULL DEFAULT 'Role',
      approver_role TEXT,
      specific_user_id TEXT,
      minimum_approvers INT NOT NULL DEFAULT 1,
      approval_mode TEXT NOT NULL DEFAULT 'Sequential',
      sla_hours INT NOT NULL DEFAULT 24,
      escalation_enabled BOOLEAN NOT NULL DEFAULT false,
      escalation_approver TEXT,
      escalation_after_hours INT,
      UNIQUE (workflow_id, version, level_number)
    );

    CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES approval_workflows(id),
      workflow_version INT NOT NULL,
      module TEXT NOT NULL,
      trigger TEXT NOT NULL,
      reference TEXT NOT NULL DEFAULT '',
      requested_by TEXT NOT NULL DEFAULT 'system',
      requested_by_name TEXT NOT NULL DEFAULT 'System',
      current_level INT NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','In Progress','Approved','Rejected','Sent Back','Cancelled','Escalated')),
      amount NUMERIC,
      context JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      due_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS approval_request_steps (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
      level_number INT NOT NULL,
      approver_type TEXT NOT NULL,
      approver_role TEXT,
      specific_user_id TEXT,
      minimum_approvers INT NOT NULL DEFAULT 1,
      approval_mode TEXT NOT NULL DEFAULT 'Sequential',
      sla_hours INT NOT NULL DEFAULT 24,
      escalation_enabled BOOLEAN NOT NULL DEFAULT false,
      escalation_approver TEXT,
      escalation_after_hours INT,
      status TEXT NOT NULL DEFAULT 'Pending',
      due_at TIMESTAMPTZ,
      decided_by TEXT,
      decided_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS approval_actions (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
      step_id BIGINT REFERENCES approval_request_steps(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'system',
      user_name TEXT NOT NULL DEFAULT 'System',
      user_role TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL DEFAULT '',
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS approval_delegations (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
      step_id BIGINT REFERENCES approval_request_steps(id) ON DELETE CASCADE,
      from_user_id TEXT,
      to_user_id TEXT,
      reason TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS approval_escalations (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
      step_id BIGINT REFERENCES approval_request_steps(id) ON DELETE CASCADE,
      escalated_to TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS approval_audit_log (
      id BIGSERIAL PRIMARY KEY,
      workflow_id TEXT REFERENCES approval_workflows(id) ON DELETE SET NULL,
      request_id TEXT REFERENCES approval_requests(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'system',
      user_name TEXT NOT NULL DEFAULT 'System',
      user_role TEXT NOT NULL DEFAULT '',
      old_value JSONB NOT NULL DEFAULT '{}',
      new_value JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON approval_requests (status);
    CREATE INDEX IF NOT EXISTS approval_requests_workflow_idx ON approval_requests (workflow_id);
    CREATE INDEX IF NOT EXISTS approval_actions_request_idx ON approval_actions (request_id, created_at);

    -- Digital fulfillment foundation. Orders and catalogue items remain
    -- frontend-owned in this imported app, so relationships use stable IDs
    -- without duplicating the existing Order/Product/Vendor tables.
    CREATE TABLE IF NOT EXISTS digital_fulfillment_orders (
      order_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS digital_fulfillment_orders_client_idx
      ON digital_fulfillment_orders (client_id);

    CREATE TABLE IF NOT EXISTS digital_fulfillments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_item_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','LICENSE_UPLOADED','PENDING_RELEASE','RELEASED','DOWNLOADED','COMPLETED','CANCELLED')),
      license_original_name TEXT,
      license_storage_key TEXT,
      license_mime_type TEXT,
      license_size BIGINT,
      encrypted_password TEXT,
      uploaded_by TEXT,
      uploaded_at TIMESTAMPTZ,
      released_by TEXT,
      released_at TIMESTAMPTZ,
      downloaded_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (order_id, order_item_id)
    );
    CREATE INDEX IF NOT EXISTS digital_fulfillments_order_idx
      ON digital_fulfillments (order_id);
    CREATE INDEX IF NOT EXISTS digital_fulfillments_client_idx
      ON digital_fulfillments (client_id);
    CREATE INDEX IF NOT EXISTS digital_fulfillments_status_idx
      ON digital_fulfillments (status);

    -- Backfill the ownership table when upgrading an installation that
    -- already has fulfillment records.
    INSERT INTO digital_fulfillment_orders (order_id, client_id)
      SELECT order_id, MIN(client_id)
      FROM digital_fulfillments
      GROUP BY order_id
      ON CONFLICT (order_id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS digital_fulfillment_audit_log (
      id BIGSERIAL PRIMARY KEY,
      fulfillment_id TEXT NOT NULL REFERENCES digital_fulfillments(id) ON DELETE CASCADE,
      event TEXT NOT NULL,
      actor_id TEXT NOT NULL DEFAULT 'system',
      actor_name TEXT NOT NULL DEFAULT 'System',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS digital_fulfillment_audit_idx
      ON digital_fulfillment_audit_log (fulfillment_id, created_at);
  `);

  await pool.query(
    `INSERT INTO email_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
  );

  for (const tpl of DEFAULT_TEMPLATES) {
    await pool.query(
      `INSERT INTO email_templates (key, name, category, subject, html_body, text_body)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (key) DO NOTHING`,
      [tpl.key, tpl.name, tpl.category, tpl.subject, tpl.html_body, tpl.text_body],
    );
  }

  migrated = true;
  console.log("[migrate] email schema ready");
}
