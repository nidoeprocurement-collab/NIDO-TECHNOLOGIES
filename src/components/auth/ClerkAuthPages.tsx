import { SignIn, SignUp } from '@clerk/react';
import { Link, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col items-center justify-center">
        <div className="mb-7 flex items-center gap-3">
          <img src="/logo.svg" alt="Nido Tech" className="h-12 w-auto" />
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-slate-500">
          Secure access to your Nido Tech workspace
        </p>
      </div>
    </main>
  );
}

export function ClerkSignInPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
      <p className="mt-4 text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link to="/sign-up" className="font-medium text-blue-600 hover:text-blue-700">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export function ClerkSignUpPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/sign-in" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

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
          Your sign-in is valid, but a System Owner has not yet provisioned
          access for this account. Contact your organization administrator, or
          sign out and use the correct account.
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
