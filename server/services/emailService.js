import { nanoid } from "nanoid";
import { pool } from "../db.js";
import { renderTemplate, isValidEmail } from "../lib/render.js";
import { getProvider } from "../lib/providers/index.js";
import { decryptSecret } from "../lib/crypto.js";

export async function getConfig() {
  const { rows } = await pool.query("SELECT * FROM email_config WHERE id = 1");
  return rows[0] || null;
}

export async function getTemplateByKey(key) {
  const { rows } = await pool.query(
    "SELECT * FROM email_templates WHERE key = $1",
    [key],
  );
  return rows[0] || null;
}

function wrapBranding(config, innerHtml) {
  const logo = config.company_logo_url
    ? `<img src="${config.company_logo_url}" alt="${config.sender_name}" style="height:32px;margin-bottom:16px;" />`
    : "";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                ${logo}
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                ${config.email_footer || ""}
                ${config.support_email ? `<br/>Support: <a href="mailto:${config.support_email}" style="color:#9ca3af;">${config.support_email}</a>` : ""}
                ${config.default_signature ? `<br/>${config.default_signature}` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function insertQueueItem({
  toEmail,
  subject,
  html,
  text,
  templateKey,
  variables,
  attachments,
  triggerModule,
  sentBy,
  maxAttempts,
  provider,
  dedupeKey,
}) {
  const { rows } = await pool.query(
    `INSERT INTO email_queue
      (id, to_email, subject, html_body, text_body, template_key, variables, attachments,
       trigger_module, sent_by, status, attempts, max_attempts, provider, dedupe_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',0,$11,$12,$13)
     ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
     RETURNING *`,
    [
      nanoid(),
      toEmail,
      subject,
      html,
      text,
      templateKey,
      JSON.stringify(variables || {}),
      JSON.stringify(attachments || []),
      triggerModule || "general",
      sentBy || "system",
      maxAttempts,
      provider,
      dedupeKey || null,
    ],
  );
  return rows[0] || null;
}

/**
 * Central entry point every module must use to send an email. Renders the
 * template, enqueues it, and kicks off delivery. No module should talk to a
 * provider directly.
 */
export async function sendEmail({
  templateKey,
  to,
  variables = {},
  attachments = [],
  triggerModule = "general",
  sentBy = "system",
  dedupeKey = null,
}) {
  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }

  const config = await getConfig();
  if (!config) throw new Error("Email configuration has not been set up yet.");
  if (!config.enabled) {
    throw new Error("Email service is disabled in Configuration Hub → Email Configuration.");
  }

  const disabledTypes = config.disabled_types || [];
  if (disabledTypes.includes(templateKey)) {
    throw new Error(`The "${templateKey}" email type is disabled.`);
  }

  const template = await getTemplateByKey(templateKey);
  if (!template) throw new Error(`Unknown email template: "${templateKey}"`);
  if (!template.enabled) throw new Error(`Email template "${templateKey}" is disabled.`);

  const mergedVars = {
    company_name: config.sender_name,
    support_email: config.support_email,
    current_date: new Date().toLocaleDateString("en-IN"),
    ...variables,
  };

  const subject = renderTemplate(template.subject, mergedVars);
  const html = wrapBranding(config, renderTemplate(template.html_body, mergedVars));
  const text = renderTemplate(template.text_body, mergedVars);

  const queued = await insertQueueItem({
    toEmail: to,
    subject,
    html,
    text,
    templateKey,
    variables: mergedVars,
    attachments,
    triggerModule,
    sentBy,
    maxAttempts: config.retry_count || 3,
    provider: config.provider,
    dedupeKey,
  });

  if (!queued) {
    return { deduped: true };
  }

  // Process immediately; retries are scheduled in the background on failure.
  const result = await processQueueItem(queued.id);
  return { id: queued.id, ...result };
}

export async function processQueueItem(id) {
  const { rows } = await pool.query("SELECT * FROM email_queue WHERE id = $1", [id]);
  const item = rows[0];
  if (!item || item.status === "sent" || item.status === "cancelled") {
    return { success: item?.status === "sent" };
  }

  const config = await getConfig();
  const apiKey = config.api_key_encrypted
    ? decryptSecret(config.api_key_encrypted)
    : process.env.RESEND_API_KEY || null;

  await pool.query(
    "UPDATE email_queue SET status = 'sending', updated_at = now() WHERE id = $1",
    [id],
  );

  try {
    const provider = getProvider(item.provider || config.provider, apiKey);
    const result = await provider.send({
      from: `${config.sender_name} <${config.sender_email}>`,
      to: item.to_email,
      replyTo: config.reply_to_email,
      subject: item.subject,
      html: item.html_body,
      text: item.text_body,
      attachments: item.attachments,
    });

    await pool.query(
      `UPDATE email_queue
       SET status = 'sent', provider_message_id = $2, sent_at = now(), updated_at = now(), last_error = NULL
       WHERE id = $1`,
      [id, result.providerMessageId || null],
    );
    return { success: true };
  } catch (err) {
    const attempts = item.attempts + 1;
    const maxAttempts = item.max_attempts || 3;
    const message = err instanceof Error ? err.message : String(err);

    if (attempts < maxAttempts) {
      await pool.query(
        `UPDATE email_queue
         SET status = 'pending', attempts = $2, last_error = $3, updated_at = now()
         WHERE id = $1`,
        [id, attempts, message],
      );
      const delayMs = Math.max(5, config.retry_interval_seconds || 60) * 1000;
      setTimeout(() => {
        processQueueItem(id).catch((e) =>
          console.error("[emailService] retry failed", e),
        );
      }, delayMs);
    } else {
      await pool.query(
        `UPDATE email_queue
         SET status = 'failed', attempts = $2, last_error = $3, updated_at = now()
         WHERE id = $1`,
        [id, attempts, message],
      );
    }
    return { success: false, error: message };
  }
}

export async function resendQueueItem(id) {
  await pool.query(
    `UPDATE email_queue SET status = 'pending', attempts = 0, last_error = NULL, updated_at = now() WHERE id = $1`,
    [id],
  );
  return processQueueItem(id);
}

export async function sendTestEmail(toEmail) {
  return sendEmail({
    templateKey: "general_notification",
    to: toEmail,
    variables: {
      user_name: "there",
      message:
        "This is a test email confirming your Email Configuration is working correctly.",
    },
    triggerModule: "email_configuration_test",
    sentBy: "admin",
  });
}

export async function sendTemplateTestEmail(templateKey, toEmail, sampleVariables = {}) {
  const template = await getTemplateByKey(templateKey);
  if (!template) throw new Error(`Unknown email template: "${templateKey}"`);
  return sendEmail({
    templateKey,
    to: toEmail,
    variables: sampleVariables,
    triggerModule: "template_test_send",
    sentBy: "admin",
  });
}
