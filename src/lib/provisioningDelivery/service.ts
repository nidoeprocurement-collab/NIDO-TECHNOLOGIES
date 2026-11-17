import {
  createWorkspaceForOrder,
  DEFAULT_OTP_SECURITY_SETTINGS,
  formatDateStamp,
} from './defaults';
import type {
  LicenceRecord,
  OtpSecuritySettings,
  ProvisioningActivityRecord,
  ProvisioningActivityType,
  ProvisioningWorkspaceState,
} from './types';

const SECURITY_SETTINGS_KEY = 'nido_provisioning_security_v1';
const WORKSPACE_PREFIX = 'nido_provisioning_workspace_v1_';

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
    // Ignore storage quota errors
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
    // Fall back to fresh workspace
  }
  return createWorkspaceForOrder(
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
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
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
    id: `ACT-${now.getTime()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    licenceRef,
    date,
    time,
    timestamp: now.getTime(),
    activity,
    userResponsible: userResponsible || 'NIDO Admin',
    status,
    remarks,
  };
}

export function computeLicenceSummary(
  licences: LicenceRecord[],
  purchasedQuantity?: number,
): ProvisioningSummaryCounts {
  let available = 0;
  let assigned = 0;
  let activated = 0;
  let pendingActivations = 0;
  let expired = 0;

  for (const lic of licences) {
    if (lic.assignmentStatus === 'Available') available += 1;
    else assigned += 1;

    const act = lic.activationRecord.status;
    if (act === 'Activated') activated += 1;
    else if (act === 'Not Activated' || act === 'Activation Pending') pendingActivations += 1;
    else if (act === 'Expired') expired += 1;
  }

  return {
    totalPurchased: Math.max(licences.length, purchasedQuantity || 0),
    available,
    assigned,
    activated,
    pendingActivations,
    expired,
  };
}
