// Default template library seeded on first run. Covers every event listed in
// the Email Service spec. Only a handful are wired into real triggers today
// (see replit.md); the rest are ready to use as soon as a module calls
// sendEmail({ templateKey: ... }).
function wrap(title, bodyHtml) {
  return `<h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h2>
<div style="font-size:15px;line-height:1.6;color:#374151;">${bodyHtml}</div>`;
}

const button = (label, url) =>
  `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">${label}</a>`;

export const DEFAULT_TEMPLATES = [
  {
    key: "welcome_email",
    name: "Welcome Email",
    category: "User Management",
    subject: "Welcome to {{company_name}}, {{user_name}}!",
    html_body: wrap(
      "Welcome aboard, {{user_name}}",
      `<p>Your account on {{company_name}}'s procurement platform is ready.</p>${button("Go to Portal", "{{portal_url}}")}`,
    ),
    text_body:
      "Welcome, {{user_name}}! Your {{company_name}} account is ready. Visit {{portal_url}} to get started.",
  },
  {
    key: "user_invitation",
    name: "User Invitation",
    category: "User Management",
    subject: "You've been invited to join {{company_name}}",
    html_body: wrap(
      "You're invited",
      `<p>{{user_name}}, you have been invited to join {{company_name}} as part of the procurement team.</p>${button("Accept Invitation", "{{portal_url}}")}`,
    ),
    text_body:
      "{{user_name}}, you've been invited to join {{company_name}}. Accept your invitation at {{portal_url}}.",
  },
  {
    key: "password_reset",
    name: "Password Reset",
    category: "User Management",
    subject: "Reset your {{company_name}} password",
    html_body: wrap(
      "Reset your password",
      `<p>Hi {{user_name}}, we received a request to reset your password. This link expires in 30 minutes.</p>${button("Reset Password", "{{portal_url}}")}<p style="margin-top:16px;font-size:13px;color:#6b7280;">If you didn't request this, you can safely ignore this email.</p>`,
    ),
    text_body:
      "Hi {{user_name}}, reset your password here: {{portal_url}} (expires in 30 minutes). If you didn't request this, ignore this email.",
  },
  {
    key: "account_activation",
    name: "Account Activation",
    category: "User Management",
    subject: "Activate your {{company_name}} account",
    html_body: wrap(
      "Activate your account",
      `<p>Hi {{user_name}}, please activate your account to start using {{company_name}}.</p>${button("Activate Account", "{{portal_url}}")}`,
    ),
    text_body: "Hi {{user_name}}, activate your account at {{portal_url}}.",
  },
  {
    key: "otp_verification",
    name: "OTP Verification",
    category: "User Management",
    subject: "Your {{company_name}} verification code",
    html_body: wrap(
      "Verification code",
      `<p>Hi {{user_name}}, your one-time verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#111827;">{{otp_code}}</p><p style="font-size:13px;color:#6b7280;">This code expires in 10 minutes.</p>`,
    ),
    text_body: "Your {{company_name}} verification code is {{otp_code}} (expires in 10 minutes).",
  },
  {
    key: "purchase_request_created",
    name: "Purchase Request Created",
    category: "Orders",
    subject: "Purchase request {{order_number}} submitted",
    html_body: wrap(
      "Purchase request submitted",
      `<p>Hi {{user_name}}, your purchase request <strong>{{order_number}}</strong> has been submitted for approval.</p>${button("View Request", "{{portal_url}}")}`,
    ),
    text_body: "Your purchase request {{order_number}} has been submitted. View it at {{portal_url}}.",
  },
  {
    key: "purchase_request_approved",
    name: "Purchase Request Approved",
    category: "Orders",
    subject: "Purchase request {{order_number}} approved",
    html_body: wrap(
      "Request approved",
      `<p>Good news, {{user_name}}! Purchase request <strong>{{order_number}}</strong> has been approved.</p>${button("View Request", "{{portal_url}}")}`,
    ),
    text_body: "Purchase request {{order_number}} has been approved.",
  },
  {
    key: "purchase_order",
    name: "Purchase Order",
    category: "Orders",
    subject: "Purchase Order {{po_number}} from {{company_name}}",
    html_body: wrap(
      "Purchase Order {{po_number}}",
      `<p>Dear {{client_name}}, please find attached Purchase Order <strong>{{po_number}}</strong> for a total of {{amount}}.</p><p>Requested delivery: {{due_date}}.</p>${button("View Order", "{{portal_url}}")}`,
    ),
    text_body:
      "Purchase Order {{po_number}} — total {{amount}}, requested delivery {{due_date}}. View at {{portal_url}}.",
  },
  {
    key: "invoice_generated",
    name: "Invoice Generated",
    category: "Finance",
    subject: "Invoice {{invoice_number}} from {{company_name}}",
    html_body: wrap(
      "Invoice {{invoice_number}}",
      `<p>Dear {{client_name}}, your invoice <strong>{{invoice_number}}</strong> for {{amount}} is ready. Payment is due by {{due_date}}.</p>${button("View Invoice", "{{portal_url}}")}`,
    ),
    text_body: "Invoice {{invoice_number}} for {{amount}} is due {{due_date}}. View at {{portal_url}}.",
  },
  {
    key: "payment_reminder",
    name: "Payment Reminder",
    category: "Finance",
    subject: "Payment reminder — invoice {{invoice_number}}",
    html_body: wrap(
      "Payment reminder",
      `<p>Dear {{client_name}}, this is a reminder that invoice <strong>{{invoice_number}}</strong> for {{amount}} is due on {{due_date}}.</p>${button("Pay Now", "{{portal_url}}")}`,
    ),
    text_body: "Reminder: invoice {{invoice_number}} for {{amount}} is due {{due_date}}.",
  },
  {
    key: "contract_assigned",
    name: "Contract Assigned",
    category: "Contracts",
    subject: "Contract {{contract_name}} has been assigned to you",
    html_body: wrap(
      "New contract assigned",
      `<p>Hi {{user_name}}, the contract <strong>{{contract_name}}</strong> has been assigned to you.</p>${button("View Contract", "{{portal_url}}")}`,
    ),
    text_body: "Contract {{contract_name}} has been assigned to you. View at {{portal_url}}.",
  },
  {
    key: "contract_renewal_reminder",
    name: "Contract Renewal Reminder",
    category: "Contracts",
    subject: "Contract {{contract_name}} renews soon",
    html_body: wrap(
      "Renewal reminder",
      `<p>Hi {{user_name}}, the contract <strong>{{contract_name}}</strong> is due for renewal on {{due_date}}.</p>${button("Review Contract", "{{portal_url}}")}`,
    ),
    text_body: "Contract {{contract_name}} is due for renewal on {{due_date}}.",
  },
  {
    key: "service_request_created",
    name: "Service Request Created",
    category: "Services",
    subject: "Service request created: {{service_name}}",
    html_body: wrap(
      "Service request received",
      `<p>Hi {{user_name}}, your service request for <strong>{{service_name}}</strong> has been received.</p>${button("View Request", "{{portal_url}}")}`,
    ),
    text_body: "Your service request for {{service_name}} has been received.",
  },
  {
    key: "service_request_updated",
    name: "Service Request Updated",
    category: "Services",
    subject: "Update on your service request: {{service_name}}",
    html_body: wrap(
      "Service request updated",
      `<p>Hi {{user_name}}, there's an update on your service request for <strong>{{service_name}}</strong>: {{approval_status}}.</p>${button("View Request", "{{portal_url}}")}`,
    ),
    text_body: "Update on {{service_name}}: {{approval_status}}.",
  },
  {
    key: "support_ticket_created",
    name: "Support Ticket Created",
    category: "Support",
    subject: "Support ticket #{{order_number}} received",
    html_body: wrap(
      "We've received your ticket",
      `<p>Hi {{user_name}}, we've received your support ticket #<strong>{{order_number}}</strong>. Our team will respond shortly.</p>`,
    ),
    text_body: "Support ticket #{{order_number}} received. We'll respond shortly.",
  },
  {
    key: "support_ticket_updated",
    name: "Support Ticket Updated",
    category: "Support",
    subject: "Update on ticket #{{order_number}}",
    html_body: wrap(
      "Ticket update",
      `<p>Hi {{user_name}}, ticket #<strong>{{order_number}}</strong> has been updated: {{approval_status}}.</p>`,
    ),
    text_body: "Ticket #{{order_number}} updated: {{approval_status}}.",
  },
  {
    key: "approval_request",
    name: "Approval Request",
    category: "Approvals",
    subject: "Approval needed: {{order_number}}",
    html_body: wrap(
      "Your approval is needed",
      `<p>Hi {{user_name}}, {{order_number}} for {{amount}} is waiting on your approval.</p>${button("Review & Approve", "{{portal_url}}")}`,
    ),
    text_body: "{{order_number}} for {{amount}} needs your approval at {{portal_url}}.",
  },
  {
    key: "approval_completed",
    name: "Approval Completed",
    category: "Approvals",
    subject: "{{order_number}} — {{approval_status}}",
    html_body: wrap(
      "Approval decision recorded",
      `<p>Hi {{user_name}}, {{order_number}} has been <strong>{{approval_status}}</strong>.</p>${button("View Details", "{{portal_url}}")}`,
    ),
    text_body: "{{order_number}} has been {{approval_status}}.",
  },
  {
    key: "vendor_invitation",
    name: "Vendor Invitation",
    category: "Vendor Management",
    subject: "{{company_name}} invites you to join as a vendor",
    html_body: wrap(
      "Vendor invitation",
      `<p>Dear {{client_name}}, {{company_name}} would like to onboard you as a registered vendor.</p>${button("Complete Onboarding", "{{portal_url}}")}`,
    ),
    text_body: "{{company_name}} invites you to onboard as a vendor at {{portal_url}}.",
  },
  {
    key: "client_invitation",
    name: "Client Invitation",
    category: "Client Management",
    subject: "{{company_name}} invites you to their client portal",
    html_body: wrap(
      "You're invited to the client portal",
      `<p>Dear {{client_name}}, you now have access to {{company_name}}'s client portal.</p>${button("Access Portal", "{{portal_url}}")}`,
    ),
    text_body: "You now have access to {{company_name}}'s client portal at {{portal_url}}.",
  },
  {
    key: "general_notification",
    name: "General Notification",
    category: "Notifications",
    subject: "{{company_name}} notification",
    html_body: wrap("Notification", `<p>Hi {{user_name}}, {{message}}</p>`),
    text_body: "Hi {{user_name}}, {{message}}",
  },
];
