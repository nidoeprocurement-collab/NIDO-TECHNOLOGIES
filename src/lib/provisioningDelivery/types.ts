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
  | 'Sent (Simulated)'
  | 'Delivered (Simulated)'
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
  encryptionStatus: 'Pending' | 'Encrypted (Simulated)';
  encryptionMethod: 'AES-256-GCM';
  secureLinkPreview: string;
  linkExpiry: LinkExpiryOption;
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
  /** Masked preview only — raw keys are kept in memory during the session and never persisted to localStorage. */
  keyMaskedPreview?: string;
  hasKeyInSession?: boolean;
  fileMetadata?: RegistrationFileMetadata;
  processingStatus: 'Pending' | 'Processed (Demo)';
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
  | 'Secure link generated (simulated)'
  | 'OTP verification attempted (simulated)'
  | 'File downloaded (simulated)'
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

