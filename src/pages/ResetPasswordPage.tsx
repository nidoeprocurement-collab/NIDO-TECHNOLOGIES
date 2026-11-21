import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgConfig } from '@/contexts/ConfigContext';

const DEFAULT_LOGIN_LOGO = '/attached_assets/image_1786602878335.png';

interface ResetPasswordPageProps {
  mode: 'request' | 'reset';
}

function extractRecoveryError(): string | null {
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
    return errorDesc || 'This password recovery link is invalid or has expired.';
  }
  return null;
}

function hasUrlRecoveryParams(): boolean {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  const hashRaw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashRaw);
  return (
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery' ||
    (Boolean(searchParams.get('token_hash')) && searchParams.get('type') === 'recovery') ||
    Boolean(searchParams.get('code'))
  );
}

export default function ResetPasswordPage({ mode }: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const { logout, isPasswordRecovery } = useAuth();
  const org = useOrgConfig();

  // Request mode state
  const [email, setEmail] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Reset mode state
  const [checkingSession, setCheckingSession] = useState(mode === 'reset');
  const [recoverySession, setRecoverySession] = useState<Session | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const recoveryEventSessionRef = useRef<Session | null>(null);

  useEffect(() => {
    if (mode !== 'reset') return;
    let mounted = true;
    let recoveryEventReceived = isPasswordRecovery;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        recoveryEventReceived = true;
        recoveryEventSessionRef.current = nextSession;
        setRecoverySession(nextSession);
        setLinkError(null);
        setCheckingSession(false);
      }
    });

    const verifyRecoverySession = async () => {
      const urlErr = extractRecoveryError();
      if (urlErr) {
        if (mounted && !recoveryEventSessionRef.current) {
          setRecoverySession(null);
          setLinkError(urlErr);
          setCheckingSession(false);
        }
        return;
      }

      if (mounted && !recoveryEventSessionRef.current) {
        setCheckingSession(true);
      }

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') as EmailOtpType | null;

        if (tokenHash && type === 'recovery') {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (!mounted) return;
          if (recoveryEventSessionRef.current) {
            setRecoverySession(recoveryEventSessionRef.current);
            setLinkError(null);
            setCheckingSession(false);
            return;
          }
          if (verifyError || !verifyData.session) {
            setRecoverySession(null);
            setLinkError(
              verifyError?.message ||
                'This password recovery link is invalid or has expired.',
            );
          } else {
            setRecoverySession(verifyData.session);
            setLinkError(null);
          }
          setCheckingSession(false);
          return;
        }

        if (
          isPasswordRecovery ||
          recoveryEventReceived ||
          recoveryEventSessionRef.current ||
          hasUrlRecoveryParams()
        ) {
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;
          const activeRecoverySession = data.session ?? recoveryEventSessionRef.current;
          if (
            activeRecoverySession &&
            (isPasswordRecovery ||
              recoveryEventReceived ||
              recoveryEventSessionRef.current ||
              hasUrlRecoveryParams())
          ) {
            setRecoverySession(activeRecoverySession);
            setLinkError(null);
            setCheckingSession(false);
            return;
          }
        }

        if (mounted && !recoveryEventSessionRef.current) {
          setRecoverySession(null);
          setLinkError(
            'No active password recovery session found. Your recovery link may have expired.',
          );
          setCheckingSession(false);
        }
      } catch {
        if (mounted && !recoveryEventSessionRef.current) {
          setRecoverySession(null);
          setLinkError('Unable to verify your password recovery link.');
          setCheckingSession(false);
        }
      }
    };

    void verifyRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [mode, isPasswordRecovery]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setRequestError('Please enter your email address.');
      return;
    }

    setRequestSubmitting(true);
    try {
      await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Never disclose whether an email belongs to a provisioned account.
      setRequestSent(true);
    } catch {
      setRequestSent(true);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!recoverySession) {
      setResetError('A valid recovery session is required to update your password.');
      return;
    }

    if (password.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setResetError(error.message || 'Unable to update password. Please try again.');
        setResetSubmitting(false);
        return;
      }

      await logout();
      setResetSuccess(true);
    } catch {
      setResetError('An unexpected error occurred. Please try again.');
    } finally {
      setResetSubmitting(false);
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

        {mode === 'request' ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="mt-1 text-sm text-gray-600">
                Enter your email address and we will send you a password recovery link if an account exists.
              </p>
            </div>

            {requestError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{requestError}</p>
              </div>
            )}

            {requestSent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    If an account exists for <span className="font-medium">{email.trim()}</span>, a password recovery link has been sent. Please check your inbox.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-sm font-medium text-gray-900 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-gray-900"
                      placeholder="your@email.com"
                      autoComplete="email"
                      disabled={requestSubmitting}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {requestSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Link…
                    </>
                  ) : (
                    'Send Recovery Link'
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft size={14} />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </>
        ) : checkingSession ? (
          <div className="py-10 flex flex-col items-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Verifying your recovery link…</p>
          </div>
        ) : linkError ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h1 className="text-base font-bold text-red-900">Recovery Link Expired</h1>
                <p className="mt-1 text-sm text-red-700">{linkError}</p>
              </div>
            </div>
            <Link
              to="/forgot-password"
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              Request a New Recovery Link
            </Link>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 text-sm transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        ) : resetSuccess ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h1 className="text-base font-bold text-green-900">Password Updated</h1>
                <p className="mt-1 text-sm text-green-800">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Choose a New Password</h1>
              <p className="mt-1 text-sm text-gray-600">
                Enter a new password for your account.
              </p>
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{resetError}</p>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-password"
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
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-gray-900"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={resetSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={resetSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
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
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white text-gray-900"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={resetSubmitting}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating Password…
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
