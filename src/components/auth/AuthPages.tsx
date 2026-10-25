import { useAuth } from "@/contexts/AuthContext";

export function AccessDeniedPage() {
  const { logout } = useAuth();

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
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your sign-in is valid, but this local prototype does not have server-managed
          account provisioning. Contact your organization administrator, or sign
          out and use a browser account already set up in this prototype.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
