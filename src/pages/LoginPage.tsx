import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { findPortalUser } from '@/lib/portalUserStore';
import { authenticateNidoUser, unlockUser, getUsers } from '@/lib/nidoUsersStore';
import { useOrgConfig } from '@/contexts/ConfigContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Zap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const org = useOrgConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const handleUnlockSelf = () => {
    const users = getUsers();
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      unlockUser(match.id);
      setError('');
      setIsLocked(false);
    } else {
      setError('Enter your email above first, then click Unlock.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLocked(false);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      // ── 1. Try NIDO internal users (nidoUsersStore) ───────────────────────
      const result = authenticateNidoUser(email.trim(), password);

      if ('user' in result && result.user) {
        const u = result.user;
        login({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          userType: 'nido_admin',
        });
        navigate('/dashboard', { replace: true });
        return;
      }

      if ('error' in result) {
        if (result.error === 'inactive') {
          setError('This account has been deactivated. Contact your administrator.');
          return;
        }
        if (result.error === 'suspended') {
          setError('This account is suspended. Contact your administrator.');
          return;
        }
        if (result.error === 'locked') {
          setError('This account has been locked after too many failed sign-in attempts.');
          setIsLocked(true);
          return;
        }
        // invalid_credentials — fall through to try client portal
      }

      // ── 2. Try Client Portal users (portalUserStore) ──────────────────────
      const portalUser = findPortalUser(email.trim(), password);
      if (portalUser) {
        login({
          id: portalUser.id,
          email: portalUser.email,
          name: portalUser.name,
          role: portalUser.role,
          userType: portalUser.userType,
          clientId: portalUser.clientId,
          clientName: portalUser.clientName,
        });
        navigate('/portal/dashboard', { replace: true });
        return;
      }

      setError('Invalid email or password.');
    } catch {
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-12 items-center"
          style={{
            fontFamily: 'Roboto, Lato, system-ui, sans-serif',
            fontWeight: '800',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            borderRadius: '15px',
          }}
        >
          {/* Left — Feature panel */}
          <div className="hidden lg:block bg-black" style={{ marginLeft: '20px' }}>
            <h1 className="text-4xl font-bold text-white mb-6">Real-time spend insights</h1>
            <div className="space-y-6">
              <p className="text-sm font-semibold text-white uppercase tracking-wider">Enterprise Features</p>
              <div className="space-y-4">
                {[
                  'Automated purchase orders',
                  'Multi-location support',
                  'Role-based access control',
                  'Multi-tenant client portal',
                  'Enterprise-grade security',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className="text-gray-400 mt-1">✓</div>
                    <p className="text-white">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-white mt-12">© {new Date().getFullYear()} {org.companyName}</p>
          </div>

          {/* Right — Login form */}
          <div className="w-full max-w-sm" style={{ marginLeft: '50px', marginRight: '-50px' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-2 md:p-10">
              {/* Logo */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  {org.logoUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <img src={org.logoUrl} alt={org.displayName || 'Logo'} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Zap size={20} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{org.displayName}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{org.industry}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <button className="pb-3 px-2 text-gray-900 font-medium border-b-2 border-gray-900">Sign In</button>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h3>
                <p className="text-gray-600 text-sm">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                  {isLocked && (
                    <button
                      type="button"
                      onClick={handleUnlockSelf}
                      className="mt-2 w-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg py-1.5 transition-colors"
                    >
                      🔓 Unlock My Account
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                      placeholder="your@email.com"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-900"
                      placeholder="••••••••••"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="animate-spin" />Signing in…</>
                  ) : (
                    <>Sign In <span>→</span></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
