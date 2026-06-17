import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Zap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@nidotech.com');
  const [password, setPassword] = useState('Owner@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validate credentials
      if (email === 'owner@nidotech.com' && password === 'Owner@123') {
        console.log('[v0] Login successful with credentials:', email);
        login({
          id: 'owner-1',
          email: email,
          name: 'System Owner',
          role: 'admin',
        });
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid email or password');
        console.log('[v0] Login failed: invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.log('[v0] Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center" style={{ fontFamily: 'Roboto, Lato, system-ui, sans-serif', fontWeight: '800', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', borderRadius: '15px' }}>
          {/* Left Section - Features */}
          <div className="hidden lg:block bg-black" style={{ marginLeft: '20px' }}>
            <p className="text-xs font-semibold text-white uppercase tracking-wider mb-8">
              CORPESSENTIALS
            </p>
            
            <h1 className="text-4xl font-bold text-white mb-6">
              Real-time spend insights
            </h1>
            
            <div className="space-y-6">
              <p className="text-sm font-semibold text-white uppercase tracking-wider">
                Enterprise Features
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 mt-1">✓</div>
                  <p className="text-white">Automated purchase orders</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 mt-1">✓</div>
                  <p className="text-gray-100">Multi-location support</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 mt-1">✓</div>
                  <p className="text-white">Role-based access control</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 mt-1">✓</div>
                  <p className="text-white">Enterprise-grade security</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-white mt-12">
              © 2024 Nido Tech CorpEssentials
            </p>
          </div>

          {/* Right Section - Login Form */}
          <div className="w-full max-w-sm" style={{ marginLeft: '50px', marginRight: '-50px' }}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Nido Tech</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">CORPESSENTIALS</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <button className="pb-3 px-4 text-gray-900 font-medium border-b-2 border-gray-900">
                  Sign In
                </button>
              </div>

              {/* Welcome Message */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h3>
                <p className="text-gray-600 text-sm">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="owner@nidotech.com"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                      placeholder="••••••••••"
                      disabled={isLoading}
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

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer Note */}
              <p className="text-xs text-gray-600 mt-6 pt-6 border-t border-gray-200">
                <span className="font-medium">User creation is owner-only.</span> Log in with the owner account to create client admin and client user accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
