import { useAuth } from "@/contexts/AuthContext";

const REASON_MESSAGES: Record<string, string> = {
  inactive_or_suspended:
    "Your account or organization is currently inactive or suspended. Contact your administrator for assistance.",
  email_mismatch_pending:
    "Your account email verification is pending or does not match your provisioned profile. Contact your administrator.",
  unprovisioned:
    "Your sign-in is valid, but your account has not been provisioned for portal access. Contact your organization administrator.",
  auth_context_error:
    "Your sign-in succeeded, but we could not load your authoritative account profile. Please try again or contact your administrator.",
  invalid_profile:
    "Your account profile is incomplete or missing an organization mapping. Contact your administrator.",
};

export function AccessDeniedPage() {
  const { logout, accessDeniedReason } = useAuth();
  const message =
    (accessDeniedReason && REASON_MESSAGES[accessDeniedReason]) ||
    "Your sign-in is valid, but your account does not have active portal access. Contact your organization administrator.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <img
          src="/favicon.svg"
          alt=""
          className="mx-auto mb-5 h-12 w-12"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold text-slate-900">
          Portal access is not active
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
