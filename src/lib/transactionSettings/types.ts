export type DocumentCategoryKey =
  | 'sales_client'
  | 'procurement_vendor'
  | 'service_other';

export interface TermsVersion {
  version: number;
  contentHtml: string;
  updatedAt: string;
  updatedBy: string;
  note?: string;
}

export interface DocumentTermsSetting {
  id: string;
  documentType: string;
  category: DocumentCategoryKey;
  categoryLabel: string;
  termsHtml: string;
  isEnabled: boolean;
  useDefault: boolean;
  currentVersion: number;
  versions: TermsVersion[];
  updatedAt: string;
  updatedBy: string;
}

export interface BankAccountSetting {
  id: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  swiftCode: string;
  accountType: 'Current' | 'Savings';
  bankAddress: string;
  upiId: string;
  paymentInstructions: string;
  qrCodeDataUrl?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SignaturePosition = 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface DigitalSignatureSetting {
  id: string;
  signatureName: string;
  authorizedPerson: string;
  designation: string;
  description: string;
  signatureImageDataUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSignatureAssignment {
  id: string;
  documentType: string;
  signatureId: string;
  position: SignaturePosition;
  isEnabled: boolean;
}

export type EmailRecipientCategory = 'client' | 'vendor' | 'internal';

export interface EmailTemplateSetting {
  id: string;
  templateName: string;
  templateCode: string;
  recipientCategory: EmailRecipientCategory;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  description: string;
  triggerEvent: string;
  ccEmail: string;
  bccEmail: string;
  attachPdf: boolean;
  isActive: boolean;
  isCustom?: boolean;
  priority: number;
  updatedAt: string;
  updatedBy: string;
}

export interface EmailBrandingSetting {
  useDefaultDesign: boolean;
  logoDataUrl?: string;
  headerText: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyAddress: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  socialLinks: string;
  copyrightText: string;
}

export interface EmailActivityLogItem {
  id: string;
  subject: string;
  recipientName: string;
  recipientEmail: string;
  recipientCategory: EmailRecipientCategory;
  templateName: string;
  triggerEvent: string;
  sentAt: string;
  deliveryStatus: 'Draft' | 'Queued' | 'Sending' | 'Sent' | 'Delivered' | 'Failed' | 'Bounced';
  failureReason?: string;
  relatedTransactionId: string;
}

export interface DynamicVariableItem {
  token: string;
  label: string;
  category:
    | 'General'
    | 'Client'
    | 'Vendor'
    | 'Employee'
    | 'Transaction'
    | 'Approval'
    | 'Service';
  sampleValue: string;
}

export interface TransactionSettingsStoreState {
  defaultTermsHtml: string;
  documentTerms: DocumentTermsSetting[];
  bankAccounts: BankAccountSetting[];
  signatures: DigitalSignatureSetting[];
  signatureAssignments: DocumentSignatureAssignment[];
  emailTemplates: EmailTemplateSetting[];
  emailBranding: EmailBrandingSetting;
  emailLogs: EmailActivityLogItem[];
}

