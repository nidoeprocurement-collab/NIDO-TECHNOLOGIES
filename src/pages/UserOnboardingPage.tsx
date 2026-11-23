import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgConfig } from '@/contexts/ConfigContext';

const DEFAULT_LOGIN_LOGO = '/attached_assets/image_1786602878335.png';

function extractUrlError(): string | null {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const hashRaw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashRaw);

  const errorCode = searchParams.get('error') || hashParams.get('error');
  const errorDesc =
    searchParams.get('error_description') || hashParams.get('error_description');

  if (errorCode || errorDesc) {
    return errorDesc || 'This invitation link is invalid or has expired.';
  }
  return null;
}

export default function UserOnboardingPage() {
  const navigate = useNavigate();
  const { refreshAuthContext, logout } = useAuth();
  const org = useOrgConfig();

  const [checkingSession, setCheckingSession] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [completedMessage, setCompletedMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const verifyInvitation = async () => {
      const urlErr = extractUrlError();
      if (urlErr) {
        if (mounted) {
          setLinkError(urlErr);
          setCheckingSession(false);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (mounted) {
            setSession(data.session);
            setCheckingSession(false);
          }
          return;
        }

        const searchParams = new URLSearchParams(window.location.search);
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') as EmailOtpType | null;

        if (tokenHash && type) {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (!mounted) return;
          if (verifyError || !verifyData.session) {
            setLinkError(
              verifyError?.message ||
                'This invitation link is invalid or has expired. Please request a new invitation.',
            );
          } else {
            setSession(verifyData.session);
          }
          setCheckingSession(false);
          return;
        }

        if (mounted) {
          setLinkError(
            'This invitation link is invalid or has expired. Please request a new invitation from your administrator.',
          );
          setCheckingSession(false);
        }
      } catch {
        if (mounted) {
          setLinkError('Unable to verify your invitation link. Please try again.');
          setCheckingSession(false);
        }
      }
    };

    void verifyInvitation();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      if (nextSession) {
        setSession(nextSession);
        setLinkError(null);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!session) {
      setFormError('Your invitation session is no longer valid. Please request a new invitation.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setFormError(updateError.message || 'Unable to set your password. Please try again.');
        setSubmitting(false);
        return;
      }

      const ctxResult = await refreshAuthContext();
      if (ctxResult.authenticated && ctxResult.context) {
        if (ctxResult.context.user_scope === 'nido_internal') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/portal/dashboard', { replace: true });
        }
        return;
      }

      setCompletedMessage(
        'Your password has been set, but your account profile is not active yet. Please contact your administrator or try signing in.',
      );
    } catch {
      setFormError('An unexpected error occurred while completing your setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-[160px] overflow-hidden bg-white flex items-center justify-start">
            <img
              src={org.logoUrl || DEFAULT_LOGIN_LOGO}
              alt={org.displayName || 'Nido Tech'}
              className="h-full w-full object-contain object-left"
            />
          </div>
        </div>

        {checkingSession ? (
          <div className="py-10 flex flex-col items-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Verifying your invitation link…</p>
          </div>
        ) : linkError ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h1 className="text-base font-bold text-red-900">Invitation Unavailable</h1>
                <p className="mt-1 text-sm text-red-700">{linkError}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        ) : completedMessage ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h1 className="text-base font-bold text-green-900">Password Updated</h1>
                <p className="mt-1 text-sm text-green-800">{completedMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Account Setup</h1>
              <p className="mt-1 text-sm text-gray-600">
                Set a password for{' '}
                <span className="font-medium text-gray-900">{session?.user?.email}</span>
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="onboarding-password"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="onboarding-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-gray-900"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={submitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="onboarding-confirm-password"
                  className="block text-sm font-medium text-gray-900 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="onboarding-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-gray-900"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving Password…
                  </>
                ) : (
                  'Activate Account'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
