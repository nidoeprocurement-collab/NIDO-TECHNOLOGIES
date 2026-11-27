import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMyClientProfile,
  updateMyClientProfile,
  type ClientProfileRecord,
} from '@/lib/clientProfileApi';
import { Building2, CheckCircle2, AlertCircle, Loader2, Save, Shield, User } from 'lucide-react';

export default function UserProfilePage() {
  const { user, refreshAuthContext } = useAuth();
  const [profile, setProfile] = useState<ClientProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg(null);
    fetchMyClientProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setName(data.name ?? '');
        setPhone(data.phone ?? '');
        setDesignation(data.designation ?? '');
        setDepartment(data.department ?? '');
      })
      .catch((err) => {
        if (!active) return;
        // Fallback display from AuthContext if offline/unavailable
        setName(user?.name ?? '');
        setDepartment(user?.department ?? '');
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load profile details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.name, user?.department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setErrorMsg('Display name must be between 2 and 120 characters.');
      return;
    }
    if (phone.trim().length > 30) {
      setErrorMsg('Phone number cannot exceed 30 characters.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyClientProfile({
        name: trimmedName,
        phone: phone.trim() || null,
        designation: designation.trim() || null,
        department: department.trim() || null,
      });
      setProfile(updated);
      setName(updated.name ?? '');
      setPhone(updated.phone ?? '');
      setDesignation(updated.designation ?? '');
      setDepartment(updated.department ?? '');
      setSuccessMsg('Profile updated successfully.');
      await refreshAuthContext?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View your organisation details and manage your contact information.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Read-only Organisation & Account Context */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organisation &amp; Access
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Organisation', value: profile?.organization_name ?? user?.clientName ?? '—' },
            { label: 'Client Code', value: profile?.client_code ?? user?.clientCode ?? '—' },
            { label: 'Email (Read-Only)', value: profile?.email ?? user?.email ?? '—' },
            { label: 'Portal Role', value: profile?.role_name ?? user?.role ?? '—' },
            { label: 'Employee Code', value: profile?.client_employee_code ?? '—' },
            { label: 'Account Status', value: profile?.status ?? 'active' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="text-gray-900 dark:text-white font-medium">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Shield size={14} className="shrink-0" />
          <span>Organisation, role, email, and status are managed by your Client Administrator.</span>
        </div>
      </div>

      {/* Editable Personal Contact Details */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <User size={18} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personal Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5"
            >
              Display Name *
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="profile-designation"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5"
            >
              Designation
            </label>
            <input
              id="profile-designation"
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              maxLength={80}
              placeholder="e.g. Procurement Lead"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="profile-department"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5"
            >
              Department
            </label>
            <input
              id="profile-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              maxLength={80}
              placeholder="e.g. Operations"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
