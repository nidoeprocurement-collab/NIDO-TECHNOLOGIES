import { useState } from 'react';
import { ChevronLeft, RotateCcw, Save, ShieldCheck, Smartphone, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_OTP_SECURITY_SETTINGS } from '@/lib/provisioningDelivery/mockData';
import { loadOtpSecuritySettings, saveOtpSecuritySettings } from '@/lib/provisioningDelivery/service';
import type { OtpDeliveryMethod, OtpSecuritySettings } from '@/lib/provisioningDelivery/types';

export default function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<OtpSecuritySettings>(() => loadOtpSecuritySettings());

  const handleSave = () => {
    const next: OtpSecuritySettings = {
      ...settings,
      otpLength: Math.min(8, Math.max(4, Number(settings.otpLength) || 6)),
      otpValidityMinutes: Math.min(30, Math.max(1, Number(settings.otpValidityMinutes) || 5)),
      maxAttempts: Math.min(10, Math.max(1, Number(settings.maxAttempts) || 3)),
      resendAvailabilitySeconds: Math.min(300, Math.max(15, Number(settings.resendAvailabilitySeconds) || 60)),
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || user?.email || 'System Owner',
    };
    setSettings(next);
    saveOtpSecuritySettings(next);
    toast.success('Provisioning Security (OTP Demo) settings saved to browser storage.');
  };

  const handleReset = () => {
    const reset: OtpSecuritySettings = {
      ...DEFAULT_OTP_SECURITY_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || user?.email || 'System Owner',
    };
    setSettings(reset);
    saveOtpSecuritySettings(reset);
    toast.info('Provisioning Security settings reset to defaults.');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/configuration')}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" />
                <h1 className="text-xl font-bold text-slate-900">Security Settings</h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configuration Hub → Security Settings → Provisioning Security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw size={13} /> Reset Defaults
            </button>
            <button
              type="button"
              data-confirmation-skip
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save size={13} /> Save Settings
            </button>
          </div>
        </div>

        {/* Frontend Demo Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Frontend Demonstration Mode — Simulated OTP &amp; Security Controls</p>
            <p>
              These preferences configure the simulated OTP verification workflow in the NIDO Secure
              Provisioning &amp; Licence Delivery System. No SMS gateway, email provider, or backend
              authentication service is connected in this phase; settings are temporarily stored in
              browser <code className="px-1 py-0.5 bg-amber-100 rounded">localStorage</code>.
            </p>
          </div>
        </div>

        {/* Provisioning Security Tab Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Provisioning Security — OTP Delivery Preferences</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure simulated OTP length, validity window, retry limits, and delivery channel.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Provisioning Security
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OTP Length (digits)
              </label>
              <input
                type="number"
                min={4}
                max={8}
                value={settings.otpLength}
                onChange={(e) => setSettings((s) => ({ ...s, otpLength: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 6 digits</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OTP Validity (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.otpValidityMinutes}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, otpValidityMinutes: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 5 minutes</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Maximum Attempts
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.maxAttempts}
                onChange={(e) => setSettings((s) => ({ ...s, maxAttempts: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 3 attempts</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Resend Availability (seconds)
              </label>
              <input
                type="number"
                min={15}
                max={300}
                value={settings.resendAvailabilitySeconds}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    resendAvailabilitySeconds: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 60 seconds</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                OTP Delivery Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      value: 'User Choice' as OtpDeliveryMethod,
                      title: 'Mobile / Email (User Choice)',
                      desc: 'Allow user to pick Mobile or Email when both are available.',
                      icon: ShieldCheck,
                    },
                    {
                      value: 'Mobile' as OtpDeliveryMethod,
                      title: 'Mobile OTP Only',
                      desc: 'Simulated SMS OTP to registered mobile number.',
                      icon: Smartphone,
                    },
                    {
                      value: 'Email' as OtpDeliveryMethod,
                      title: 'Email OTP Only',
                      desc: 'Simulated Email OTP to registered email address.',
                      icon: Mail,
                    },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = settings.deliveryMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, deliveryMethod: opt.value }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Icon size={14} className={active ? 'text-blue-600' : 'text-slate-400'} />
                        {opt.title}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

