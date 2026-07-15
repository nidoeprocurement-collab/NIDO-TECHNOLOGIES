import { Resend } from "resend";

export function createResendProvider(apiKey) {
  const client = new Resend(apiKey);
  return {
    name: "resend",
    async send({ from, to, replyTo, subject, html, text, attachments }) {
      const { data, error } = await client.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        reply_to: replyTo || undefined,
        subject,
        html,
        text,
        attachments:
          attachments && attachments.length
            ? attachments.map((a) => ({
                filename: a.filename,
                content: a.content, // base64 string
              }))
            : undefined,
      });

      if (error) {
        throw new Error(
          typeof error === "string"
            ? error
            : error.message || "Resend failed to send the email.",
        );
      }

      return { providerMessageId: data?.id ?? null };
    },
  };
}
