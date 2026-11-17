import {
  createDefaultWorkspaceForOrder,
  DEFAULT_OTP_SECURITY_SETTINGS,
  formatDateStamp,
} from './mockData';
import type {
  LicenceRecord,
  OtpSecuritySettings,
  ProvisioningActivityRecord,
  ProvisioningActivityType,
  ProvisioningWorkspaceState,
} from './types';

// Temporary frontend demonstration storage keys.
// Replace these methods with Supabase/API calls during backend integration.
// NOTE: Real registration keys and confidential file contents are NEVER stored in localStorage.
const SECURITY_SETTINGS_KEY = 'nido_provisioning_security_demo_v1';
const WORKSPACE_PREFIX = 'nido_provisioning_demo_v1_';

export interface ProvisioningSummaryCounts {
  totalPurchased: number;
  available: number;
  assigned: number;
  activated: number;
  pendingActivations: number;
  expired: number;
}

export function loadOtpSecuritySettings(): OtpSecuritySettings {
  try {
    const raw = localStorage.getItem(SECURITY_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_OTP_SECURITY_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<OtpSecuritySettings>;
    return {
      otpLength: Number(parsed.otpLength) || DEFAULT_OTP_SECURITY_SETTINGS.otpLength,
      otpValidityMinutes:
        Number(parsed.otpValidityMinutes) || DEFAULT_OTP_SECURITY_SETTINGS.otpValidityMinutes,
      maxAttempts: Number(parsed.maxAttempts) || DEFAULT_OTP_SECURITY_SETTINGS.maxAttempts,
      resendAvailabilitySeconds:
        Number(parsed.resendAvailabilitySeconds) ||
        DEFAULT_OTP_SECURITY_SETTINGS.resendAvailabilitySeconds,
      deliveryMethod:
        parsed.deliveryMethod || DEFAULT_OTP_SECURITY_SETTINGS.deliveryMethod,
      updatedAt: parsed.updatedAt || DEFAULT_OTP_SECURITY_SETTINGS.updatedAt,
      updatedBy: parsed.updatedBy || DEFAULT_OTP_SECURITY_SETTINGS.updatedBy,
    };
  } catch {
    return { ...DEFAULT_OTP_SECURITY_SETTINGS };
  }
}

export function saveOtpSecuritySettings(settings: OtpSecuritySettings): void {
  try {
    localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('provisioningSecuritySettingsUpdated'));
  } catch {
    // Ignore storage quota issues in frontend demo mode
  }
}

export function loadProvisioningWorkspace(
  orderId: string,
  subOrderId: string,
  clientName: string,
  productName: string,
  purchasedQuantity: number,
): ProvisioningWorkspaceState {
  const key = `${WORKSPACE_PREFIX}${orderId}_${subOrderId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProvisioningWorkspaceState>;
      if (Array.isArray(parsed.licences) && parsed.licences.length > 0) {
        return {
          orderId,
          subOrderId,
          clientName: parsed.clientName || clientName,
          productName: parsed.productName || productName,
          purchasedQuantity: Math.max(purchasedQuantity, parsed.licences.length),
          licences: parsed.licences,
          history: Array.isArray(parsed.history) ? parsed.history : [],
        };
      }
    }
  } catch {
    // Fall back to default mock/initial state
  }
  return createDefaultWorkspaceForOrder(
    orderId,
    subOrderId,
    clientName,
    productName,
    purchasedQuantity,
  );
}

export function saveProvisioningWorkspace(state: ProvisioningWorkspaceState): void {
  const key = `${WORKSPACE_PREFIX}${state.orderId}_${state.subOrderId}`;
  try {
    // Strip any transient session-only flags; never persist raw keys or file blobs in localStorage.
    const sanitized: ProvisioningWorkspaceState = {
      ...state,
      licences: state.licences.map((lic) => ({
        ...lic,
        hasKeyInSession: Boolean(lic.keyMaskedPreview),
      })),
    };
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota issues in frontend demo mode
  }
}

export function createActivityEntry(
  licenceRef: string,
  activity: ProvisioningActivityType,
  userResponsible: string,
  status: string,
  remarks: string,
): ProvisioningActivityRecord {
  const now = new Date();
  const { date, time } = formatDateStamp(now);
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    licenceRef,
    date,
    time,
    timestamp: now.getTime(),
    activity,
    userResponsible: userResponsible || 'System Admin',
    status,
    remarks,
  };
}

export function computeLicenceSummary(
  licences: LicenceRecord[],
  purchasedQuantity?: number,
): ProvisioningSummaryCounts {
  const totalPurchased = Math.max(purchasedQuantity ?? 0, licences.length);
  const available = licences.filter((l) => l.assignmentStatus === 'Available').length;
  const assigned = licences.filter((l) => l.assignmentStatus === 'Assigned').length;
  const activated = licences.filter((l) => l.activationRecord.status === 'Activated').length;
  const pendingActivations = licences.filter(
    (l) =>
      l.activationRecord.status === 'Not Activated' ||
      l.activationRecord.status === 'Activation Pending',
  ).length;
  const expired = licences.filter((l) => l.activationRecord.status === 'Expired').length;
  return {
    totalPurchased,
    available,
    assigned,
    activated,
    pendingActivations,
    expired,
  };
}

