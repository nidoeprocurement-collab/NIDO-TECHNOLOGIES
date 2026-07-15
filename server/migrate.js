import { pool } from "./db.js";
import { DEFAULT_TEMPLATES } from "./templateDefaults.js";

let migrated = false;

export async function migrate() {
  if (migrated) return;
  if (!pool) {
    throw new Error(
      "SUPABASE_DB_URL is not set — email features are disabled.",
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
