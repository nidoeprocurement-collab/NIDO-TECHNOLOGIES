// Thin fetch client for the centralized Email Service (server/). Every
// module that needs to send an email should call `sendEmail(...)` from here
// rather than talking to a provider directly.

export interface EmailConfig {
  id: number;
  provider: string;
  sender_name: string;
  sender_email: string;
  reply_to_email: string;
  support_email: string;
  company_logo_url: string;
  email_footer: string;
  default_signature: string;
  default_language: string;
  default_timezone: string;
  rate_limit_per_hour: number;
  retry_count: number;
  retry_interval_seconds: number;
  enabled: boolean;
  disabled_types: string[];
  hasApiKey: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface EmailProviderOption {
  value: string;
  label: string;
  available: boolean;
}

export interface EmailTemplate {
  id: number;
  key: string;
  name: string;
  category: string;
  subject: string;
  html_body: string;
  text_body: string;
  enabled: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface EmailTemplateVersion {
  id: number;
  template_id: number;
  version: number;
  subject: string;
  html_body: string;
  text_body: string;
  created_at: string;
  created_by: string | null;
}

export interface EmailTemplateDetail extends EmailTemplate {
  detectedVariables: string[];
  versions: EmailTemplateVersion[];
}

export type EmailLogStatus = "pending" | "sending" | "sent" | "failed" | "cancelled";

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template_key: string | null;
  trigger_module: string;
  status: EmailLogStatus;
  provider: string;
  last_error: string | null;
  attempts: number;
  sent_by: string;
  created_at: string;
  sent_at: string | null;
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  detail?: string;
  pagination?: { page: number; limit: number; total: number };
  providers?: EmailProviderOption[];
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`/api/email${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const json = await res.json().catch(() => ({ success: false, error: "Invalid server response." }));
  if (!res.ok && !json.error) {
    json.error = `Request failed with status ${res.status}`;
  }
  return json;
}

export function getEmailConfig() {
  return request<EmailConfig>("/config");
}

export function updateEmailConfig(payload: Record<string, unknown>) {
  return request<EmailConfig>("/config", { method: "PUT", body: JSON.stringify(payload) });
}

export function sendTestConfigEmail(to: string) {
  return request<{ id: string }>("/test-send", { method: "POST", body: JSON.stringify({ to }) });
}

export function listEmailTemplates() {
  return request<EmailTemplate[]>("/templates");
}

export function getEmailTemplate(key: string) {
  return request<EmailTemplateDetail>(`/templates/${encodeURIComponent(key)}`);
}

export function createEmailTemplate(payload: {
  key: string;
  name: string;
  category?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}) {
  return request<EmailTemplate>("/templates", { method: "POST", body: JSON.stringify(payload) });
}

export function updateEmailTemplate(
  key: string,
  payload: Partial<{
    name: string;
    category: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    enabled: boolean;
    updatedBy: string;
  }>,
) {
  return request<EmailTemplate>(`/templates/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteEmailTemplate(key: string) {
  return request<null>(`/templates/${encodeURIComponent(key)}`, { method: "DELETE" });
}

export function sendTemplateTest(key: string, to: string, sampleVariables?: Record<string, string>) {
  return request<{ id: string }>(`/templates/${encodeURIComponent(key)}/test-send`, {
    method: "POST",
    body: JSON.stringify({ to, sampleVariables }),
  });
}

export interface SendEmailPayload {
  templateKey: string;
  to: string;
  variables?: Record<string, string | number>;
  attachments?: { filename: string; content: string }[];
  triggerModule?: string;
  sentBy?: string;
  dedupeKey?: string;
}

/** The single entry point every feature module should use to send an email. */
export function sendEmail(payload: SendEmailPayload) {
  return request<{ id: string; success?: boolean }>("/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listEmailLogs(params: {
  status?: string;
  templateKey?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.templateKey) qs.set("templateKey", params.templateKey);
  if (params.search) qs.set("search", params.search);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 25));
  return request<EmailLog[]>(`/logs?${qs.toString()}`);
}

export function getEmailLog(id: string) {
  return request<EmailLog & { html_body: string; text_body: string; variables: Record<string, unknown> }>(
    `/logs/${encodeURIComponent(id)}`,
  );
}

export function resendEmailLog(id: string) {
  return request<{ success: boolean; error?: string }>(`/logs/${encodeURIComponent(id)}/resend`, {
    method: "POST",
  });
}

export function downloadEmailLogUrl(id: string) {
  return `/api/email/logs/${encodeURIComponent(id)}/download`;
}
