export interface SendEmailPayload {
  templateKey: string;
  to: string;
  variables?: Record<string, string | number>;
  attachments?: { filename: string; content: string }[];
  triggerModule?: string;
  sentBy?: string;
  dedupeKey?: string;
}

/**
 * Email is intentionally disabled in the local-only prototype.
 * Return an explicit failure so callers never show a false delivery success.
 */
export async function sendEmail(_payload: SendEmailPayload): Promise<{
  success: false;
  error: string;
}> {
  return {
    success: false,
    error: "Email delivery is unavailable in local-only prototype mode.",
  };
}
