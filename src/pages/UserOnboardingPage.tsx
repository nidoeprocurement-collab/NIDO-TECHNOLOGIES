import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  clearCapturedAuthRedirectSnapshot,
  getCapturedAuthRedirectSnapshot,
  parseJwtClaims,
} from '@/lib/authRedirectSnapshot';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgConfig } from '@/contexts/ConfigContext';

const DEFAULT_LOGIN_LOGO = '/attached_assets/image_1786602878335.png';

function extractUrlError(search: string, hash: string): string | null {
  if (!search && !hash) return null;
  const searchParams = new URLSearchParams(search);
  const hashRaw = hash.startsWith('#') ? hash.slice(1) : hash;
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
  const verifiedIdentityRef = useRef<{
    userId: string;
    email: string;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [completedMessage, setCompletedMessage] = useState('');

  function isVerifiedInvitationSession(candidate: Session | null | undefined): candidate is Session {
    if (!candidate?.user?.id || typeof candidate.user.email !== 'string') return false;
    if (!candidate.user.email.trim()) return false;
    const confirmedAt =
      candidate.user.email_confirmed_at ??
      (candidate.user as { confirmed_at?: string | null }).confirmed_at;
    return Boolean(confirmedAt);
  }

  useEffect(() => {
    let mounted = true;
    let cancelledByTokenFailure = false;
    verifiedIdentityRef.current = null;

    const liveSearch = typeof window !== 'undefined' ? window.location.search : '';
    const liveHash = typeof window !== 'undefined' ? window.location.hash : '';
    const snapshot =
      typeof window !== 'undefined'
        ? getCapturedAuthRedirectSnapshot(window.location.pathname)
        : null;
    const effectiveSearch = liveSearch || snapshot?.search || '';
    const effectiveHash = liveHash || snapshot?.hash || '';

    const searchParams = new URLSearchParams(effectiveSearch);
    const hashRaw = effectiveHash.startsWith('#')
      ? effectiveHash.slice(1)
      : effectiveHash;
    const hashParams = new URLSearchParams(hashRaw);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const codeParam = searchParams.get('code');
    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');
    const isRecoveryLink = type === 'recovery' || hashType === 'recovery';
    const hasHashInvite = Boolean(
      hashAccessToken && (!hashType || hashType === 'invite'),
    );
    const hasUrlInviteCredential = Boolean(
      !isRecoveryLink && ((tokenHash && type === 'invite') || codeParam || hasHashInvite),
    );
    const hashTokenClaims = hashAccessToken ? parseJwtClaims(hashAccessToken) : null;

    const matchesInvitedHashSession = (candidate: Session | null | undefined): boolean => {
      if (!isVerifiedInvitationSession(candidate)) return false;
      if (hashTokenClaims?.sub || hashTokenClaims?.email) {
        if (hashTokenClaims.sub && candidate.user.id !== hashTokenClaims.sub) {
          return false;
        }
        if (
          hashTokenClaims.email &&
          candidate.user.email!.trim().toLowerCase() !==
            hashTokenClaims.email.trim().toLowerCase()
        ) {
          return false;
        }
        return true;
      }
      return Boolean(hashAccessToken && candidate.access_token === hashAccessToken);
    };

    const acceptVerifiedSession = (nextSession: Session | null | undefined, failureMessage: string) => {
      if (!mounted) return;
      if (!isVerifiedInvitationSession(nextSession)) {
        cancelledByTokenFailure = true;
        verifiedIdentityRef.current = null;
        setSession(null);
        setLinkError(
          nextSession?.user?.id
            ? 'Your account email is not verified yet. Please use a valid invitation link.'
            : failureMessage,
        );
        setCheckingSession(false);
        return;
      }
      verifiedIdentityRef.current = {
        userId: nextSession.user.id,
        email: nextSession.user.email!.trim().toLowerCase(),
      };
      setSession(nextSession);
      setLinkError(null);
      setCheckingSession(false);
    };

    const rejectInvitation = (message: string) => {
      cancelledByTokenFailure = true;
      verifiedIdentityRef.current = null;
      if (mounted) {
        setSession(null);
        setLinkError(message);
        setCheckingSession(false);
      }
    };

    const verifyInvitation = async () => {
      const urlErr = extractUrlError(effectiveSearch, effectiveHash);
      if (urlErr) {
        clearCapturedAuthRedirectSnapshot();
        rejectInvitation(urlErr);
        return;
      }

      if (isRecoveryLink) {
        clearCapturedAuthRedirectSnapshot();
        rejectInvitation(
          'This link is for password recovery, not invitation onboarding. Please use the password reset page.',
        );
        return;
      }

      if (!hasUrlInviteCredential) {
        rejectInvitation(
          'This invitation link is invalid or has expired. Please request a new invitation from your administrator.',
        );
        return;
      }

      try {
        if (tokenHash && type) {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (!mounted) return;
          if (verifyError || !verifyData.session) {
            rejectInvitation(
              verifyError?.message ||
                'This invitation link is invalid or has expired. Please request a new invitation.',
            );
            return;
          }
          acceptVerifiedSession(
            verifyData.session,
            'This invitation link is invalid or has expired. Please request a new invitation.',
          );
          return;
        }

        if (codeParam) {
          const exchangeFn = (
            supabase.auth as unknown as {
              exchangeCodeForSession?: (
                authCode: string,
              ) => Promise<{ data: { session: Session | null }; error: { message?: string } | null }>;
            }
          ).exchangeCodeForSession;

          if (typeof exchangeFn !== 'function') {
            rejectInvitation('Unable to verify your invitation code. Please request a new invitation.');
            return;
          }

          const { data: exchangeData, error: exchangeError } = await exchangeFn.call(
            supabase.auth,
            codeParam,
          );
          if (!mounted) return;
          if (exchangeError || !exchangeData?.session) {
            rejectInvitation(
              exchangeError?.message ||
                'This invitation link is invalid or has expired. Please request a new invitation.',
            );
            return;
          }
          acceptVerifiedSession(
            exchangeData.session,
            'This invitation link is invalid or has expired. Please request a new invitation.',
          );
          return;
        }

        if (hasHashInvite && hashAccessToken) {
          const { data: existingSessionData } = await supabase.auth.getSession();
          if (!mounted) return;
          if (
            existingSessionData.session &&
            matchesInvitedHashSession(existingSessionData.session)
          ) {
            clearCapturedAuthRedirectSnapshot();
            acceptVerifiedSession(
              existingSessionData.session,
              'This invitation link is invalid or has expired. Please request a new invitation.',
            );
            return;
          }

          const setSessionFn = (
            supabase.auth as unknown as {
              setSession?: (params: {
                access_token: string;
                refresh_token: string;
              }) => Promise<{ data: { session: Session | null }; error: { message?: string } | null }>;
            }
          ).setSession;

          if (hashRefreshToken && typeof setSessionFn === 'function') {
            const { data: setData, error: setError } = await setSessionFn.call(supabase.auth, {
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            });
            if (!mounted) return;
            if (setError || !setData?.session || !matchesInvitedHashSession(setData.session)) {
              clearCapturedAuthRedirectSnapshot();
              rejectInvitation(
                setError?.message ||
                  'This invitation link is invalid or has expired. Please request a new invitation.',
              );
              return;
            }
            clearCapturedAuthRedirectSnapshot();
            acceptVerifiedSession(
              setData.session,
              'This invitation link is invalid or has expired. Please request a new invitation.',
            );
            return;
          }

          clearCapturedAuthRedirectSnapshot();
          rejectInvitation(
            'This invitation link is invalid or has expired. Please request a new invitation.',
          );
          return;
        }

        rejectInvitation(
          'This invitation link is invalid or has expired. Please request a new invitation from your administrator.',
        );
      } catch {
        rejectInvitation('Unable to verify your invitation link. Please try again.');
      }
    };

    void verifyInvitation();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted || cancelledByTokenFailure || !hasUrlInviteCredential) return;
      if (
        nextSession &&
        (event === 'SIGNED_IN' || event === 'USER_UPDATED')
      ) {
        if (hasHashInvite && hashAccessToken && !matchesInvitedHashSession(nextSession)) {
          return;
        }
        if (
          verifiedIdentityRef.current &&
          nextSession.user?.id !== verifiedIdentityRef.current.userId
        ) {
          return;
        }
        acceptVerifiedSession(
          nextSession,
          'This invitation link is invalid or has expired. Please request a new invitation.',
        );
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

    const verifiedIdentity = verifiedIdentityRef.current;
    if (
      !session ||
      !verifiedIdentity ||
      !isVerifiedInvitationSession(session) ||
      session.user.id !== verifiedIdentity.userId ||
      session.user.email!.trim().toLowerCase() !== verifiedIdentity.email
    ) {
      setFormError('Your invitation session is no longer valid. Please request a new invitation.');
      return;
    }

    const { data: currentSessionData } = await supabase.auth.getSession();
    if (
      currentSessionData.session?.user?.id &&
      currentSessionData.session.user.id !== verifiedIdentity.userId
    ) {
      setFormError('Active session does not match the invited user. Please re-open your invitation link.');
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
