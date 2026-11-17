import { generateCryptographicToken } from './cryptoVault';
import type {
  LicenceRecord,
  LinkExpiryOption,
  OtpSecuritySettings,
  ProvisioningWorkspaceState,
} from './types';

export const DEFAULT_OTP_SECURITY_SETTINGS: OtpSecuritySettings = {
  otpLength: 6,
  otpValidityMinutes: 5,
  maxAttempts: 3,
  resendAvailabilitySeconds: 60,
  deliveryMethod: 'User Choice',
  updatedAt: new Date().toISOString(),
  updatedBy: 'NIDO Super Admin',
};

export function formatDateStamp(d = new Date()): { date: string; time: string } {
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date, time };
}

export function maskRegistrationKey(rawKey: string): string {
  const clean = rawKey.trim();
  if (!clean) return '****';
  if (clean.length <= 6) return `${clean.slice(0, 2)}****`;
  return `${clean.slice(0, 4)}-****-****-${clean.slice(-4)}`;
}

export function computeExpiryTimestamp(expiry: LinkExpiryOption, fromMs = Date.now()): number {
  const hours = expiry === '24 hours' ? 24 : expiry === '7 days' ? 24 * 7 : 48;
  return fromMs + hours * 60 * 60 * 1000;
}

export function buildSecureDeliveryLink(orderId: string, licenceRef: string): {
  token: string;
  url: string;
} {
  const token = `${orderId}-${licenceRef}-${generateCryptographicToken(8)}`.toUpperCase();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://portal.nidotech.in';
  return {
    token,
    url: `${origin}/secure-delivery/${encodeURIComponent(token)}`,
  };
}

export function createEmptyLicenceRecord(
  orderId: string,
  subOrderId: string,
  productName: string,
  index: number,
): LicenceRecord {
  const ref = `LIC-${String(index + 1).padStart(3, '0')}`;
  const { date, time } = formatDateStamp();
  const { token, url } = buildSecureDeliveryLink(orderId, ref);
  return {
    id: `${orderId}-${subOrderId}-${ref}`,
    orderId,
    subOrderId,
    licenceRef: ref,
    productName,
    registrationType: 'Unassigned',
    processingStatus: 'Pending',
    assignmentStatus: 'Available',
    previousAssignments: [],
    activationRecord: {
      status: 'Not Activated',
      activationDate: '',
      activationTime: '',
      actualUserName: '',
      employeeId: '',
      email: '',
      deviceName: '',
      updatedBy: '',
      remarks: '',
    },
    deliveryRecord: {
      encryptionStatus: 'Pending',
      encryptionMethod: 'AES-256-GCM',
      secureLinkPreview: url,
      linkToken: token,
      linkExpiry: '48 hours',
      linkExpiresAt: computeExpiryTimestamp('48 hours'),
      downloadLimit: 3,
      downloadCount: 0,
      deliveryStatus: 'Not Prepared',
      emailNotificationPrepared: false,
      recipientEmail: '',
      lastGeneratedAt: `${date} · ${time}`,
      revoked: false,
    },
    lastUpdated: `${date} · ${time}`,
  };
}

export function createWorkspaceForOrder(
  orderId: string,
  subOrderId: string,
  clientName: string,
  productName: string,
  purchasedQuantity: number,
): ProvisioningWorkspaceState {
  const qty = Math.max(1, Number(purchasedQuantity) || 1);
  const { date, time } = formatDateStamp();
  const licences = Array.from({ length: qty }, (_, idx) =>
    createEmptyLicenceRecord(orderId, subOrderId, productName, idx),
  );
  return {
    orderId,
    subOrderId,
    clientName,
    productName,
    purchasedQuantity: qty,
    licences,
    history: [
      {
        id: `ACT-${Date.now()}-INIT`,
        licenceRef: 'ORDER',
        date,
        time,
        timestamp: Date.now(),
        activity: 'Secure link generated',
        userResponsible: 'System',
        status: 'Initialized',
        remarks: `Created ${qty} individual unassigned licence record(s) for ${productName}.`,
      },
    ],
  };
}

