export type RegistrationType = 'Key' | 'File' | 'Key & File' | 'Unassigned';

export type AssignmentStatus = 'Available' | 'Assigned';

export type ActivationStatus =
  | 'Not Activated'
  | 'Activation Pending'
  | 'Activated'
  | 'Failed'
  | 'Suspended'
  | 'Deactivated'
  | 'Expired';

export type DeliveryStatus =
  | 'Not Prepared'
  | 'Ready'
  | 'Sent'
  | 'Delivered'
  | 'Revoked';

export type LinkExpiryOption = '24 hours' | '48 hours' | '7 days';

export type OtpDeliveryMethod = 'Mobile' | 'Email' | 'User Choice';

export interface RegistrationFileMetadata {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadDate: string;
}

export interface LicenceAssignmentRecord {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  designation: string;
  assignmentDate: string;
  assignedBy: string;
  remarks: string;
}

export interface LicenceActivationRecord {
  status: ActivationStatus;
  activationDate: string;
  activationTime: string;
  actualUserName: string;
  employeeId: string;
  email: string;
  deviceName?: string;
  updatedBy: string;
  remarks: string;
  supportingDocName?: string;
}

export interface LicenceDeliveryRecord {
  encryptionStatus: 'Pending' | 'Encrypted';
  encryptionMethod: 'AES-256-GCM';
  encryptionFingerprint?: string;
  secureLinkPreview: string;
  linkToken: string;
  linkExpiry: LinkExpiryOption;
  linkExpiresAt: number;
  downloadLimit: number;
  downloadCount: number;
  deliveryStatus: DeliveryStatus;
  emailNotificationPrepared: boolean;
  recipientEmail: string;
  lastGeneratedAt: string;
  revoked: boolean;
}

export interface LicenceRecord {
  id: string;
  orderId: string;
  subOrderId: string;
  licenceRef: string;
  productName: string;
  registrationType: RegistrationType;
  /** Masked preview for table display; raw key/file payloads are encrypted via Web Crypto AES-256-GCM in IndexedDB. */
  keyMaskedPreview?: string;
  hasKeyInVault?: boolean;
  hasFileInVault?: boolean;
  fileMetadata?: RegistrationFileMetadata;
  processingStatus: 'Pending' | 'Provisioned';
  assignmentStatus: AssignmentStatus;
  assignedEmployee?: LicenceAssignmentRecord;
  previousAssignments: LicenceAssignmentRecord[];
  activationRecord: LicenceActivationRecord;
  deliveryRecord: LicenceDeliveryRecord;
  lastUpdated: string;
}

export type ProvisioningActivityType =
  | 'Registration key entered'
  | 'Registration file uploaded'
  | 'Encryption status changed'
  | 'Delivery notification prepared'
  | 'Secure link generated'
  | 'OTP verification attempted'
  | 'File downloaded'
  | 'Licence assigned'
  | 'Activation details updated'
  | 'Licence reassigned'
  | 'Licence deactivated'
  | 'Licence expired'
  | 'Registration file replaced'
  | 'Access revoked';

export interface ProvisioningActivityRecord {
  id: string;
  licenceRef: string;
  date: string;
  time: string;
  timestamp: number;
  activity: ProvisioningActivityType;
  userResponsible: string;
  status: string;
  remarks: string;
}

export interface OtpSecuritySettings {
  otpLength: number;
  otpValidityMinutes: number;
  maxAttempts: number;
  resendAvailabilitySeconds: number;
  deliveryMethod: OtpDeliveryMethod;
  updatedAt: string;
  updatedBy: string;
}

export interface ProvisioningWorkspaceState {
  orderId: string;
  subOrderId: string;
  clientName: string;
  productName: string;
  purchasedQuantity: number;
  licences: LicenceRecord[];
  history: ProvisioningActivityRecord[];
}

