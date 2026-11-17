import type {
  LicenceRecord,
  OtpSecuritySettings,
  ProvisioningActivityRecord,
  ProvisioningWorkspaceState,
} from './types';

export const DEFAULT_OTP_SECURITY_SETTINGS: OtpSecuritySettings = {
  otpLength: 6,
  otpValidityMinutes: 5,
  maxAttempts: 3,
  resendAvailabilitySeconds: 60,
  deliveryMethod: 'User Choice',
  updatedAt: '2026-11-16T09:00:00.000Z',
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

export function buildSimulatedSecureLink(orderId: string, licenceRef: string): string {
  const token = `${orderId}-${licenceRef}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
  return `https://demo-secure.nidotech.local/delivery/${encodeURIComponent(token)}`;
}

export function createEmptyLicenceRecord(
  orderId: string,
  subOrderId: string,
  productName: string,
  index: number,
): LicenceRecord {
  const ref = `LIC-${String(index + 1).padStart(3, '0')}`;
  const { date, time } = formatDateStamp();
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
      secureLinkPreview: buildSimulatedSecureLink(orderId, ref),
      linkExpiry: '48 hours',
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

export function createDefaultWorkspaceForOrder(
  orderId: string,
  subOrderId: string,
  clientName: string,
  productName: string,
  purchasedQuantity: number,
): ProvisioningWorkspaceState {
  if (orderId === 'NIDO-ORD-00125') {
    return createSampleOrderWorkspace();
  }
  const qty = Math.max(1, Number(purchasedQuantity) || 1);
  const licences: LicenceRecord[] = Array.from({ length: qty }, (_, idx) =>
    createEmptyLicenceRecord(orderId, subOrderId, productName, idx),
  );
  const { date, time } = formatDateStamp();
  const history: ProvisioningActivityRecord[] = [
    {
      id: `hist-init-${Date.now()}`,
      licenceRef: licences[0]?.licenceRef || 'LIC-001',
      date,
      time,
      timestamp: Date.now(),
      activity: 'Delivery notification prepared',
      userResponsible: 'System (Frontend Demo)',
      status: 'Available',
      remarks: `Initialized ${qty} unassigned licence record(s) for ${productName} (not auto-assigned at purchase).`,
    },
  ];
  return {
    orderId,
    subOrderId,
    clientName,
    productName,
    purchasedQuantity: qty,
    licences,
    history,
  };
}

export function createSampleOrderWorkspace(): ProvisioningWorkspaceState {
  const orderId = 'NIDO-ORD-00125';
  const subOrderId = 'SO-NIDO-ORD-00125-001';
  const productName = 'Adobe Acrobat Pro 2024';

  const lic1: LicenceRecord = {
    id: `${orderId}-${subOrderId}-LIC-001`,
    orderId,
    subOrderId,
    licenceRef: 'LIC-001',
    productName,
    registrationType: 'Key & File',
    keyMaskedPreview: 'ADBE-****-****-9482',
    hasKeyInSession: true,
    fileMetadata: {
      fileName: 'Adobe_Acrobat_Pro_2024_LIC001.lic',
      fileType: 'application/octet-stream (.lic)',
      fileSizeBytes: 4280,
      uploadDate: '16 Nov 2026',
    },
    processingStatus: 'Processed (Demo)',
    assignmentStatus: 'Assigned',
    assignedEmployee: {
      employeeName: 'Rahul Kumar',
      employeeId: 'ABC-EMP-104',
      email: 'rahul@abc.com',
      department: 'Finance',
      designation: 'Senior Analyst',
      assignmentDate: '2026-11-16',
      assignedBy: 'Client Admin (ABC Technologies)',
      remarks: 'Assigned for PDF compliance & contract signing.',
    },
    previousAssignments: [],
    activationRecord: {
      status: 'Activated',
      activationDate: '2026-11-16',
      activationTime: '11:15',
      actualUserName: 'Rahul Kumar',
      employeeId: 'ABC-EMP-104',
      email: 'rahul@abc.com',
      deviceName: 'ABC-FIN-LT04',
      updatedBy: 'NIDO Provisioning Admin',
      remarks: 'Manually verified activation on client workstation.',
      supportingDocName: 'rahul_activation_confirmation.png',
    },
    deliveryRecord: {
      encryptionStatus: 'Encrypted (Simulated)',
      encryptionMethod: 'AES-256-GCM',
      secureLinkPreview: 'https://demo-secure.nidotech.local/delivery/NIDO-ORD-00125-LIC-001',
      linkExpiry: '48 hours',
      downloadLimit: 3,
      downloadCount: 1,
      deliveryStatus: 'Delivered (Simulated)',
      emailNotificationPrepared: true,
      recipientEmail: 'rahul@abc.com',
      lastGeneratedAt: '16 Nov 2026 · 10:30 AM',
      revoked: false,
    },
    lastUpdated: '16 Nov 2026 · 11:15 AM',
  };

  const lic2: LicenceRecord = {
    id: `${orderId}-${subOrderId}-LIC-002`,
    orderId,
    subOrderId,
    licenceRef: 'LIC-002',
    productName,
    registrationType: 'Key',
    keyMaskedPreview: 'ADBE-****-****-3170',
    hasKeyInSession: true,
    processingStatus: 'Processed (Demo)',
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
      encryptionStatus: 'Encrypted (Simulated)',
      encryptionMethod: 'AES-256-GCM',
      secureLinkPreview: 'https://demo-secure.nidotech.local/delivery/NIDO-ORD-00125-LIC-002',
      linkExpiry: '48 hours',
      downloadLimit: 3,
      downloadCount: 0,
      deliveryStatus: 'Ready',
      emailNotificationPrepared: false,
      recipientEmail: '',
      lastGeneratedAt: '16 Nov 2026 · 10:30 AM',
      revoked: false,
    },
    lastUpdated: '16 Nov 2026 · 10:30 AM',
  };

  const now = Date.now();
  const history: ProvisioningActivityRecord[] = [
    {
      id: 'hist-sample-5',
      licenceRef: 'LIC-001',
      date: '16 Nov 2026',
      time: '11:15 AM',
      timestamp: now - 1000 * 60 * 15,
      activity: 'Activation details updated',
      userResponsible: 'NIDO Provisioning Admin',
      status: 'Activated',
      remarks: 'Manually marked Activated for Rahul Kumar (ABC-FIN-LT04).',
    },
    {
      id: 'hist-sample-4',
      licenceRef: 'LIC-001',
      date: '16 Nov 2026',
      time: '10:45 AM',
      timestamp: now - 1000 * 60 * 45,
      activity: 'Licence assigned',
      userResponsible: 'Client Admin (ABC Technologies)',
      status: 'Assigned',
      remarks: 'Assigned to Rahul Kumar (rahul@abc.com) — Finance.',
    },
    {
      id: 'hist-sample-3',
      licenceRef: 'LIC-001',
      date: '16 Nov 2026',
      time: '10:35 AM',
      timestamp: now - 1000 * 60 * 55,
      activity: 'Encryption status changed',
      userResponsible: 'System (Demo)',
      status: 'Encrypted (Simulated)',
      remarks: 'AES-256-GCM simulated encryption envelope prepared.',
    },
    {
      id: 'hist-sample-2',
      licenceRef: 'LIC-001',
      date: '16 Nov 2026',
      time: '10:32 AM',
      timestamp: now - 1000 * 60 * 58,
      activity: 'Registration file uploaded',
      userResponsible: 'NIDO Provisioning Admin',
      status: 'Processed (Demo)',
      remarks: 'Uploaded Adobe_Acrobat_Pro_2024_LIC001.lic.',
    },
    {
      id: 'hist-sample-1',
      licenceRef: 'LIC-001',
      date: '16 Nov 2026',
      time: '10:30 AM',
      timestamp: now - 1000 * 60 * 60,
      activity: 'Registration key entered',
      userResponsible: 'NIDO Provisioning Admin',
      status: 'Pending',
      remarks: 'Masked key recorded for LIC-001 (raw key never stored in localStorage).',
    },
  ];

  return {
    orderId,
    subOrderId,
    clientName: 'ABC Technologies Pvt. Ltd.',
    productName,
    purchasedQuantity: 2,
    licences: [lic1, lic2],
    history,
  };
}

