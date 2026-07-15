// Provider abstraction layer. Every module sends email through the central
// Email Service (see server/services/emailService.js), which selects a
// provider here based on Email Configuration. Adding a new provider means
// adding one file in this directory and one case below -- no other module
// changes.
import { createResendProvider } from "./resend.js";

export const SUPPORTED_PROVIDERS = [
  { value: "resend", label: "Resend", available: true },
  { value: "sendgrid", label: "SendGrid", available: false },
  { value: "ses", label: "Amazon SES", available: false },
  { value: "mailgun", label: "Mailgun", available: false },
  { value: "smtp", label: "SMTP", available: false },
];

export function getProvider(providerName, apiKey) {
  switch (providerName) {
    case "resend":
      if (!apiKey) {
        throw new Error(
          "Resend API key is not configured. Add it in Configuration Hub → Email Configuration.",
        );
      }
      return createResendProvider(apiKey);
    default:
      throw new Error(
        `Email provider "${providerName}" is not yet available. Currently supported: Resend.`,
      );
  }
}
