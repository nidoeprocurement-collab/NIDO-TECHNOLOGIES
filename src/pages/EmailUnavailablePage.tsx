import { AlertTriangle, Mail } from "lucide-react";

export default function EmailUnavailablePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center p-6">
      <section
        role="status"
        className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-700">
          <Mail aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Email tools are unavailable
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-700">
          This local-only prototype has no email server or provider connection.
          Messages cannot be delivered, and email configuration, templates, and
          delivery logs are disabled.
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-amber-900">
          <AlertTriangle size={14} aria-hidden="true" />
          Do not use this prototype to send customer communications.
        </p>
      </section>
    </main>
  );
}
