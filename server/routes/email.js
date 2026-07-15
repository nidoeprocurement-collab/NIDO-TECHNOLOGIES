import { Router } from "express";
import { pool } from "../db.js";
import { encryptSecret } from "../lib/crypto.js";
import { extractVariables, isValidEmail } from "../lib/render.js";
import { SUPPORTED_PROVIDERS } from "../lib/providers/index.js";
import { migrate } from "../migrate.js";
import {
  getConfig,
  getTemplateByKey,
  sendEmail,
  resendQueueItem,
  sendTestEmail,
  sendTemplateTestEmail,
} from "../services/emailService.js";

const router = Router();

// Every request retries the (idempotent, cached-on-success) migration first,
// so the Email Service comes online automatically as soon as the database
// connection string is fixed -- no restart required.
router.use(async (_req, res, next) => {
  try {
    await migrate();
    next();
  } catch (err) {
    res.status(503).json({
      success: false,
      error:
        "Email database is not reachable. Check the SUPABASE_DB_URL secret (use the pooled connection string, not the direct one).",
      detail: err.message,
    });
  }
});

// Wraps an async route handler so DB/provider errors return JSON instead of
// crashing the process or hanging the request.
function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function serializeConfig(config) {
  if (!config) return null;
  const { api_key_encrypted, ...rest } = config;
  return { ...rest, hasApiKey: Boolean(api_key_encrypted) };
}

// ── Configuration ───────────────────────────────────────────────────────
router.get("/config", ah(async (_req, res) => {
  const config = await getConfig();
  res.json({ success: true, data: serializeConfig(config), providers: SUPPORTED_PROVIDERS });
}));

router.put("/config", async (req, res) => {
  try {
    const body = req.body || {};
    const current = await getConfig();
    if (!current) return res.status(500).json({ success: false, error: "Email configuration row missing." });

    if (body.senderEmail && !isValidEmail(body.senderEmail)) {
      return res.status(400).json({ success: false, error: "Sender email is not valid." });
    }
    if (body.supportEmail && !isValidEmail(body.supportEmail)) {
      return res.status(400).json({ success: false, error: "Support email is not valid." });
    }

    const apiKeyEncrypted =
      body.apiKey && body.apiKey.trim().length > 0
        ? encryptSecret(body.apiKey.trim())
        : current.api_key_encrypted;

    const updated = {
      provider: body.provider ?? current.provider,
      sender_name: body.senderName ?? current.sender_name,
      sender_email: body.senderEmail ?? current.sender_email,
      reply_to_email: body.replyToEmail ?? current.reply_to_email,
      support_email: body.supportEmail ?? current.support_email,
      company_logo_url: body.companyLogoUrl ?? current.company_logo_url,
      email_footer: body.emailFooter ?? current.email_footer,
      default_signature: body.defaultSignature ?? current.default_signature,
      default_language: body.defaultLanguage ?? current.default_language,
      default_timezone: body.defaultTimezone ?? current.default_timezone,
      rate_limit_per_hour: body.rateLimitPerHour ?? current.rate_limit_per_hour,
      retry_count: body.retryCount ?? current.retry_count,
      retry_interval_seconds: body.retryIntervalSeconds ?? current.retry_interval_seconds,
      enabled: body.enabled ?? current.enabled,
      disabled_types: body.disabledTypes ?? current.disabled_types,
    };

    const { rows } = await pool.query(
      `UPDATE email_config SET
        provider=$1, sender_name=$2, sender_email=$3, reply_to_email=$4, support_email=$5,
        company_logo_url=$6, email_footer=$7, api_key_encrypted=$8, default_signature=$9,
        default_language=$10, default_timezone=$11, rate_limit_per_hour=$12, retry_count=$13,
        retry_interval_seconds=$14, enabled=$15, disabled_types=$16, updated_at=now(), updated_by=$17
       WHERE id = 1 RETURNING *`,
      [
        updated.provider,
        updated.sender_name,
        updated.sender_email,
        updated.reply_to_email,
        updated.support_email,
        updated.company_logo_url,
        updated.email_footer,
        apiKeyEncrypted,
        updated.default_signature,
        updated.default_language,
        updated.default_timezone,
        updated.rate_limit_per_hour,
        updated.retry_count,
        updated.retry_interval_seconds,
        updated.enabled,
        JSON.stringify(updated.disabled_types),
        body.updatedBy || "admin",
      ],
    );

    res.json({ success: true, data: serializeConfig(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/test-send", async (req, res) => {
  try {
    const { to } = req.body || {};
    if (!isValidEmail(to)) {
      return res.status(400).json({ success: false, error: "A valid recipient email is required." });
    }
    const result = await sendTestEmail(to);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── Templates ────────────────────────────────────────────────────────────
router.get("/templates", ah(async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM email_templates ORDER BY category, name",
  );
  res.json({ success: true, data: rows });
}));

router.get("/templates/:key", ah(async (req, res) => {
  const template = await getTemplateByKey(req.params.key);
  if (!template) return res.status(404).json({ success: false, error: "Template not found." });
  const { rows: versions } = await pool.query(
    "SELECT * FROM email_template_versions WHERE template_id = $1 ORDER BY version DESC",
    [template.id],
  );
  res.json({
    success: true,
    data: {
      ...template,
      detectedVariables: [
        ...new Set([...extractVariables(template.subject), ...extractVariables(template.html_body)]),
      ],
      versions,
    },
  });
}));

router.post("/templates", async (req, res) => {
  try {
    const { key, name, category, subject, htmlBody, textBody } = req.body || {};
    if (!key || !name || !subject || !htmlBody) {
      return res.status(400).json({ success: false, error: "key, name, subject and htmlBody are required." });
    }
    const { rows } = await pool.query(
      `INSERT INTO email_templates (key, name, category, subject, html_body, text_body)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [key, name, category || "General", subject, htmlBody, textBody || ""],
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, error: `Template key "${req.body?.key}" already exists.` });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/templates/:key", async (req, res) => {
  try {
    const existing = await getTemplateByKey(req.params.key);
    if (!existing) return res.status(404).json({ success: false, error: "Template not found." });

    const { name, category, subject, htmlBody, textBody, enabled, updatedBy } = req.body || {};

    // Snapshot the current version into history before overwriting.
    await pool.query(
      `INSERT INTO email_template_versions (template_id, version, subject, html_body, text_body, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [existing.id, existing.version, existing.subject, existing.html_body, existing.text_body, updatedBy || "admin"],
    );

    const { rows } = await pool.query(
      `UPDATE email_templates SET
        name=$2, category=$3, subject=$4, html_body=$5, text_body=$6, enabled=$7,
        version = version + 1, updated_at = now(), updated_by = $8
       WHERE key = $1 RETURNING *`,
      [
        req.params.key,
        name ?? existing.name,
        category ?? existing.category,
        subject ?? existing.subject,
        htmlBody ?? existing.html_body,
        textBody ?? existing.text_body,
        enabled ?? existing.enabled,
        updatedBy || "admin",
      ],
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/templates/:key", ah(async (req, res) => {
  await pool.query("DELETE FROM email_templates WHERE key = $1", [req.params.key]);
  res.json({ success: true });
}));

router.post("/templates/:key/test-send", async (req, res) => {
  try {
    const { to, sampleVariables } = req.body || {};
    if (!isValidEmail(to)) {
      return res.status(400).json({ success: false, error: "A valid recipient email is required." });
    }
    const result = await sendTemplateTestEmail(req.params.key, to, sampleVariables || {});
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── Generic send endpoint used by every module in the app ────────────────
router.post("/send", async (req, res) => {
  try {
    const { templateKey, to, variables, attachments, triggerModule, sentBy, dedupeKey } = req.body || {};
    if (!templateKey || !to) {
      return res.status(400).json({ success: false, error: "templateKey and to are required." });
    }
    const result = await sendEmail({
      templateKey,
      to,
      variables,
      attachments,
      triggerModule,
      sentBy,
      dedupeKey,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── Logs / Queue ─────────────────────────────────────────────────────────
router.get("/logs", ah(async (req, res) => {
  const { status, templateKey, search, page = "1", limit = "25" } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (templateKey) {
    params.push(templateKey);
    conditions.push(`template_key = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(to_email ILIKE $${params.length} OR subject ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const offset = (pageNum - 1) * limitNum;

  const countResult = await pool.query(`SELECT COUNT(*) FROM email_queue ${where}`, params);
  params.push(limitNum, offset);
  const { rows } = await pool.query(
    `SELECT id, to_email, subject, template_key, trigger_module, status, provider,
            last_error, attempts, sent_by, created_at, sent_at
     FROM email_queue ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  res.json({
    success: true,
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: Number(countResult.rows[0].count),
    },
  });
}));

router.get("/logs/:id", ah(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM email_queue WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, error: "Log entry not found." });
  res.json({ success: true, data: rows[0] });
}));

router.post("/logs/:id/resend", async (req, res) => {
  try {
    const result = await resendQueueItem(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/logs/:id/download", ah(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM email_queue WHERE id = $1", [req.params.id]);
  const log = rows[0];
  if (!log) return res.status(404).json({ success: false, error: "Log entry not found." });
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="email-log-${log.id}.json"`);
  res.send(JSON.stringify(log, null, 2));
}));

// Fallback error handler for anything that slips past individual try/catch
// blocks above -- always JSON, never an HTML stack trace. Must be registered
// last so Express treats it as error-handling middleware.
router.use((err, _req, res, _next) => {
  console.error("[email routes] unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || "Unexpected error." });
});

export default router;
