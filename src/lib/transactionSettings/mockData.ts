import type {
  BankAccountSetting,
  DigitalSignatureSetting,
  DocumentCategoryKey,
  DocumentSignatureAssignment,
  DocumentTermsSetting,
  DynamicVariableItem,
  EmailActivityLogItem,
  EmailBrandingSetting,
  EmailRecipientCategory,
  EmailTemplateSetting,
  TransactionSettingsStoreState,
} from './types';

const NOW = '2026-11-15T09:00:00.000Z';
const ADMIN_USER = 'Dr. Praveen Gojanur (System Owner)';

export const DEFAULT_TERMS_HTML = `<ol>
  <li><strong>Payment Terms:</strong> All payments must be remitted within the credit period specified on the document.</li>
  <li><strong>Taxes &amp; Duties:</strong> GST and applicable statutory levies are charged as per prevailing government regulations.</li>
  <li><strong>Jurisdiction:</strong> All disputes arising out of this transaction are subject to Bengaluru jurisdiction only.</li>
</ol>`;

const DOCUMENT_CATALOGUE: Array<{
  documentType: string;
  category: DocumentCategoryKey;
  categoryLabel: string;
  termsHtml?: string;
}> = [
  // A. Sales & Client Documents
  {
    documentType: 'Proforma Invoice',
    category: 'sales_client',
    categoryLabel: 'Sales & Client Documents',
    termsHtml: `<ol>
  <li>This Proforma Invoice is valid for 15 days from the date of issue.</li>
  <li>Order dispatch or provisioning begins upon advance payment confirmation.</li>
  <li>All bank charges or remittance fees shall be borne by the remitter.</li>
</ol>`,
  },
  {
    documentType: 'Tax Invoice',
    category: 'sales_client',
    categoryLabel: 'Sales & Client Documents',
    termsHtml: `<ol>
  <li>Payment is due within the agreed credit period from the invoice date.</li>
  <li>Delayed payments beyond due date attract 1.5% monthly interest.</li>
  <li>Goods once sold and accepted will not be taken back unless defective on arrival.</li>
</ol>`,
  },
  { documentType: 'Commercial Invoice', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },
  { documentType: 'Credit Note', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },
  { documentType: 'Debit Note', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },
  { documentType: 'Sales Quotation', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },
  { documentType: 'Sales Order', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },
  { documentType: 'Payment Receipt', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },
  { documentType: 'Refund Receipt', category: 'sales_client', categoryLabel: 'Sales & Client Documents' },

  // B. Procurement & Vendor Documents
  { documentType: 'Purchase Requisition', category: 'procurement_vendor', categoryLabel: 'Procurement & Vendor Documents' },
  {
    documentType: 'Purchase Order',
    category: 'procurement_vendor',
    categoryLabel: 'Procurement & Vendor Documents',
    termsHtml: `<ol>
  <li>Quote the Purchase Order number on all invoices, packing slips, and delivery challans.</li>
  <li>Delivery must adhere strictly to the scheduled SLA and quality specifications.</li>
  <li>NIDO Technologies reserves the right to reject damaged or non-conforming goods.</li>
</ol>`,
  },
  { documentType: 'Vendor Bill', category: 'procurement_vendor', categoryLabel: 'Procurement & Vendor Documents' },
  { documentType: 'Goods Receipt Note (GRN)', category: 'procurement_vendor', categoryLabel: 'Procurement & Vendor Documents' },
  { documentType: 'Vendor Payment Advice', category: 'procurement_vendor', categoryLabel: 'Procurement & Vendor Documents' },
  { documentType: 'Vendor Debit Note', category: 'procurement_vendor', categoryLabel: 'Procurement & Vendor Documents' },
  { documentType: 'Vendor Credit Note', category: 'procurement_vendor', categoryLabel: 'Procurement & Vendor Documents' },

  // C. Service & Other Documents
  { documentType: 'Service Invoice', category: 'service_other', categoryLabel: 'Service & Other Documents' },
  { documentType: 'Service Quotation', category: 'service_other', categoryLabel: 'Service & Other Documents' },
  { documentType: 'Service Order', category: 'service_other', categoryLabel: 'Service & Other Documents' },
  { documentType: 'Delivery Challan', category: 'service_other', categoryLabel: 'Service & Other Documents' },
  { documentType: 'Subscription Invoice', category: 'service_other', categoryLabel: 'Service & Other Documents' },
  { documentType: 'Digital Product Licence Document', category: 'service_other', categoryLabel: 'Service & Other Documents' },
  { documentType: 'Service Completion Document', category: 'service_other', categoryLabel: 'Service & Other Documents' },
];

export const INITIAL_DOCUMENT_TERMS: DocumentTermsSetting[] = DOCUMENT_CATALOGUE.map((doc, idx) => {
  const html = doc.termsHtml ?? DEFAULT_TERMS_HTML;
  return {
    id: `terms-${idx + 1}`,
    documentType: doc.documentType,
    category: doc.category,
    categoryLabel: doc.categoryLabel,
    termsHtml: html,
    isEnabled: true,
    useDefault: !doc.termsHtml,
    currentVersion: 1,
    versions: [
      {
        version: 1,
        contentHtml: html,
        updatedAt: NOW,
        updatedBy: ADMIN_USER,
        note: 'Initial baseline terms',
      },
    ],
    updatedAt: NOW,
    updatedBy: ADMIN_USER,
  };
});

export const INITIAL_BANK_ACCOUNTS: BankAccountSetting[] = [
  {
    id: 'bank-1',
    accountHolderName: 'Nido Technologies Pvt. Ltd.',
    bankName: 'HDFC Bank Ltd.',
    branchName: 'Koramangala 4th Block, Bengaluru',
    accountNumber: '50200048192041',
    ifscCode: 'HDFC0000142',
    swiftCode: 'HDFCINBBXXX',
    accountType: 'Current',
    bankAddress: 'No. 412, 80 Feet Road, Koramangala 4th Block, Bengaluru - 560034',
    upiId: 'nidotech@hdfcbank',
    paymentInstructions: 'Please mention the Invoice Number in the NEFT/RTGS/UPI payment remarks.',
    isDefault: true,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'bank-2',
    accountHolderName: 'Nido Technologies Pvt. Ltd.',
    bankName: 'ICICI Bank Ltd.',
    branchName: 'Indiranagar 100ft Road, Bengaluru',
    accountNumber: '000905031284',
    ifscCode: 'ICIC0000009',
    swiftCode: 'ICICINBBCTS',
    accountType: 'Current',
    bankAddress: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038',
    upiId: 'nidotech.corp@icici',
    paymentInstructions: 'Use for high-value enterprise RTGS settlements.',
    isDefault: false,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const INITIAL_SIGNATURES: DigitalSignatureSetting[] = [
  {
    id: 'sig-1',
    signatureName: 'Primary Authorized Signatory',
    authorizedPerson: 'Dr. Praveen Gojanur',
    designation: 'Authorized Signatory',
    description: 'Default corporate signatory for Tax Invoices, Proforma Invoices, and Purchase Orders.',
    isActive: true,
    isDefault: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'sig-2',
    signatureName: 'Finance Controller Signatory',
    authorizedPerson: 'Ananya Rao',
    designation: 'Head of Finance & Accounts',
    description: 'Used for Payment Receipts, Credit Notes, and Vendor Payment Advices.',
    isActive: true,
    isDefault: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SIGNATURE_ASSIGNMENT_DOCUMENTS = [
  'Proforma Invoice',
  'Tax Invoice',
  'Commercial Invoice',
  'Purchase Order',
  'Sales Order',
  'Service Invoice',
  'Service Quotation',
  'Vendor Payment Advice',
  'Delivery Challan',
  'Payment Receipt',
];

export const INITIAL_SIGNATURE_ASSIGNMENTS: DocumentSignatureAssignment[] =
  SIGNATURE_ASSIGNMENT_DOCUMENTS.map((docType, index) => ({
    id: `sig-assign-${index + 1}`,
    documentType: docType,
    signatureId:
      docType === 'Vendor Payment Advice' || docType === 'Payment Receipt' ? 'sig-2' : 'sig-1',
    position: 'bottom-right',
    isEnabled: true,
  }));

export const DYNAMIC_VARIABLES: DynamicVariableItem[] = [
  // General
  { token: '{{company_name}}', label: 'Company Name', category: 'General', sampleValue: 'Nido Technologies Pvt. Ltd.' },
  { token: '{{company_logo}}', label: 'Company Logo URL', category: 'General', sampleValue: 'https://nido.example.com/logo.png' },
  { token: '{{recipient_name}}', label: 'Recipient Name', category: 'General', sampleValue: 'Aarav Mehta' },
  { token: '{{recipient_email}}', label: 'Recipient Email', category: 'General', sampleValue: 'aarav.mehta@clientcorp.in' },
  { token: '{{current_date}}', label: 'Current Date', category: 'General', sampleValue: '15 Nov 2026' },
  { token: '{{support_email}}', label: 'Support Email', category: 'General', sampleValue: 'support@nidotech.in' },
  { token: '{{support_phone}}', label: 'Support Phone', category: 'General', sampleValue: '+91 80 4123 9000' },
  { token: '{{platform_url}}', label: 'Platform URL', category: 'General', sampleValue: 'https://portal.nidotech.in' },
  // Client
  { token: '{{client_name}}', label: 'Client Name', category: 'Client', sampleValue: 'Apex Enterprise Solutions' },
  { token: '{{client_id}}', label: 'Client ID', category: 'Client', sampleValue: 'CL-1042' },
  { token: '{{client_company}}', label: 'Client Company', category: 'Client', sampleValue: 'Apex Enterprise Solutions Pvt. Ltd.' },
  { token: '{{client_contact_person}}', label: 'Client Contact Person', category: 'Client', sampleValue: 'Aarav Mehta' },
  { token: '{{client_portal_link}}', label: 'Client Portal Link', category: 'Client', sampleValue: 'https://portal.nidotech.in/client' },
  // Vendor
  { token: '{{vendor_name}}', label: 'Vendor Name', category: 'Vendor', sampleValue: 'Global Office Supplies Co.' },
  { token: '{{vendor_id}}', label: 'Vendor ID', category: 'Vendor', sampleValue: 'VN-2088' },
  { token: '{{vendor_company}}', label: 'Vendor Company', category: 'Vendor', sampleValue: 'Global Office Supplies Pvt. Ltd.' },
  { token: '{{vendor_contact_person}}', label: 'Vendor Contact Person', category: 'Vendor', sampleValue: 'Rohan Kapoor' },
  { token: '{{vendor_portal_link}}', label: 'Vendor Portal Link', category: 'Vendor', sampleValue: 'https://portal.nidotech.in/vendor' },
  // Employee
  { token: '{{employee_name}}', label: 'Employee Name', category: 'Employee', sampleValue: 'Priya Nair' },
  { token: '{{employee_id}}', label: 'Employee ID', category: 'Employee', sampleValue: 'EMP-019' },
  { token: '{{employee_role}}', label: 'Employee Role', category: 'Employee', sampleValue: 'Procurement Manager' },
  { token: '{{employee_department}}', label: 'Employee Department', category: 'Employee', sampleValue: 'Procurement Operations' },
  { token: '{{employee_email}}', label: 'Employee Email', category: 'Employee', sampleValue: 'priya.nair@nidotech.in' },
  // Transaction
  { token: '{{document_number}}', label: 'Document Number', category: 'Transaction', sampleValue: 'INV-202600042' },
  { token: '{{document_date}}', label: 'Document Date', category: 'Transaction', sampleValue: '15 Nov 2026' },
  { token: '{{document_type}}', label: 'Document Type', category: 'Transaction', sampleValue: 'Tax Invoice' },
  { token: '{{purchase_order_number}}', label: 'Purchase Order Number', category: 'Transaction', sampleValue: 'PO-2026-0118' },
  { token: '{{invoice_number}}', label: 'Invoice Number', category: 'Transaction', sampleValue: 'INV-202600042' },
  { token: '{{invoice_amount}}', label: 'Invoice Amount', category: 'Transaction', sampleValue: '₹1,25,000.00' },
  { token: '{{tax_amount}}', label: 'Tax Amount', category: 'Transaction', sampleValue: '₹22,500.00' },
  { token: '{{grand_total}}', label: 'Grand Total', category: 'Transaction', sampleValue: '₹1,47,500.00' },
  { token: '{{payment_due_date}}', label: 'Payment Due Date', category: 'Transaction', sampleValue: '30 Nov 2026' },
  { token: '{{payment_status}}', label: 'Payment Status', category: 'Transaction', sampleValue: 'Sent Invoice' },
  { token: '{{order_status}}', label: 'Order Status', category: 'Transaction', sampleValue: 'Dispatched' },
  { token: '{{tracking_number}}', label: 'Tracking Number', category: 'Transaction', sampleValue: 'BLUEDART-88412904' },
  // Approval
  { token: '{{request_number}}', label: 'Request Number', category: 'Approval', sampleValue: 'REQ-2026-0309' },
  { token: '{{requester_name}}', label: 'Requester Name', category: 'Approval', sampleValue: 'Karan Verma' },
  { token: '{{approver_name}}', label: 'Approver Name', category: 'Approval', sampleValue: 'Dr. Praveen Gojanur' },
  { token: '{{approval_status}}', label: 'Approval Status', category: 'Approval', sampleValue: 'Approved' },
  { token: '{{approval_date}}', label: 'Approval Date', category: 'Approval', sampleValue: '15 Nov 2026' },
  { token: '{{approval_comments}}', label: 'Approval Comments', category: 'Approval', sampleValue: 'Approved as per Q4 budget allocation.' },
  // Service
  { token: '{{service_request_id}}', label: 'Service Request ID', category: 'Service', sampleValue: 'SRV-2026-0074' },
  { token: '{{service_name}}', label: 'Service Name', category: 'Service', sampleValue: 'Annual IT Infrastructure AMC' },
  { token: '{{service_status}}', label: 'Service Status', category: 'Service', sampleValue: 'Completed' },
  { token: '{{service_completion_date}}', label: 'Service Completion Date', category: 'Service', sampleValue: '15 Nov 2026' },
];

const CLIENT_TEMPLATE_NAMES = [
  'Client Welcome Email',
  'Client Account Activation',
  'Client User Invitation',
  'Email Verification',
  'Password Reset',
  'Password Changed Confirmation',
  'New Purchase Request Notification',
  'Purchase Request Approved',
  'Purchase Request Rejected',
  'Purchase Order Created',
  'Purchase Order Confirmation',
  'Order Processing Notification',
  'Order Shipped Notification',
  'Order Delivered Notification',
  'Proforma Invoice Generated',
  'Tax Invoice Generated',
  'Payment Due Reminder',
  'Payment Received Confirmation',
  'Payment Overdue Reminder',
  'Credit Note Generated',
  'Debit Note Generated',
  'Service Request Created',
  'Service Request Status Update',
  'Service Completed Notification',
  'Contract Created',
  'Contract Expiry Reminder',
  'Approval Pending Notification',
  'General Announcements',
];

const VENDOR_TEMPLATE_NAMES = [
  'Vendor Welcome Email',
  'Vendor Account Activation',
  'Vendor User Invitation',
  'Email Verification',
  'Password Reset',
  'Vendor Profile Approval',
  'Vendor Profile Rejection',
  'Product Assignment Notification',
  'New Purchase Order Received',
  'Purchase Order Updated',
  'Purchase Order Cancellation',
  'Order Confirmation Request',
  'Goods Dispatch Notification',
  'Shipment Tracking Update',
  'Goods Received Confirmation',
  'Vendor Bill Submission Reminder',
  'Vendor Bill Approved',
  'Vendor Bill Rejected',
  'Payment Processing Notification',
  'Payment Completed Confirmation',
  'Payment Overdue Notification',
  'Vendor Contract Created',
  'Vendor Contract Expiry Reminder',
  'Product Price Update Request',
  'Product Stock Update Request',
  'General Announcements',
];

const INTERNAL_TEMPLATE_NAMES = [
  'Employee Welcome Email',
  'Employee Account Activation',
  'New User Invitation',
  'Password Reset',
  'Password Changed Confirmation',
  'Role Assigned Notification',
  'Permission Updated Notification',
  'New Client Registration',
  'New Vendor Registration',
  'Client Approval Notification',
  'Vendor Approval Notification',
  'New Purchase Request Notification',
  'Purchase Request Approval Required',
  'Purchase Order Created',
  'Invoice Generated',
  'Payment Received Notification',
  'Payment Due Alert',
  'Vendor Bill Received',
  'Vendor Bill Approval Required',
  'Service Request Notification',
  'Contract Expiry Alert',
  'System Maintenance Notification',
  'Security Alert',
  'General Platform Announcements',
];

function buildPredefinedTemplates(
  names: string[],
  category: EmailRecipientCategory,
  prefix: string,
): EmailTemplateSetting[] {
  const portalToken =
    category === 'client'
      ? '{{client_portal_link}}'
      : category === 'vendor'
        ? '{{vendor_portal_link}}'
        : '{{platform_url}}';

  return names.map((name, idx) => {
    const slug = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const code = `${prefix}_${slug}`;
    const subject =
      category === 'client' && name.includes('Invoice')
        ? `${name}: {{invoice_number}} — {{grand_total}}`
        : category === 'vendor' && name.includes('Purchase Order')
          ? `${name}: {{purchase_order_number}} from {{company_name}}`
          : `${name} — {{company_name}}`;

    const bodyHtml = `<p>Dear {{recipient_name}},</p>
<p>This is an automated notification regarding <strong>${name}</strong> on {{company_name}}.</p>
<p><strong>Reference:</strong> {{document_number}} | <strong>Date:</strong> {{current_date}}</p>
<p>You can review complete details in your portal: <a href="${portalToken}">${portalToken}</a>.</p>
<p>If you need any assistance, contact us at {{support_email}} or {{support_phone}}.</p>
<p>Regards,<br/><strong>{{company_name}}</strong></p>`;

    const bodyText = `Dear {{recipient_name}},\n\nThis is an automated notification regarding ${name} on {{company_name}}.\nReference: {{document_number}} | Date: {{current_date}}\nPortal: ${portalToken}\nSupport: {{support_email}} | {{support_phone}}\n\nRegards,\n{{company_name}}`;

    return {
      id: `tpl-${category}-${idx + 1}`,
      templateName: name,
      templateCode: code,
      recipientCategory: category,
      subject,
      bodyHtml,
      bodyText,
      description: `Automated ${category === 'internal' ? 'internal user' : category} communication for ${name.toLowerCase()}.`,
      triggerEvent: name,
      ccEmail: '',
      bccEmail: '',
      attachPdf: name.includes('Invoice') || name.includes('Purchase Order') || name.includes('Note'),
      isActive: true,
      priority: idx + 1,
      updatedAt: NOW,
      updatedBy: ADMIN_USER,
    };
  });
}

export const INITIAL_EMAIL_TEMPLATES: EmailTemplateSetting[] = [
  ...buildPredefinedTemplates(CLIENT_TEMPLATE_NAMES, 'client', 'CLI'),
  ...buildPredefinedTemplates(VENDOR_TEMPLATE_NAMES, 'vendor', 'VND'),
  ...buildPredefinedTemplates(INTERNAL_TEMPLATE_NAMES, 'internal', 'USR'),
];

export const INITIAL_EMAIL_BRANDING: EmailBrandingSetting = {
  useDefaultDesign: true,
  headerText: 'NIDO B2B Procurement Platform',
  footerText: 'Thank you for partnering with Nido Technologies.',
  primaryColor: '#1F5FBE',
  secondaryColor: '#0F172A',
  fontFamily: 'Inter, Arial, sans-serif',
  companyAddress: 'Koramangala 4th Block, Bengaluru - 560034, Karnataka, India',
  supportEmail: 'support@nidotech.in',
  supportPhone: '+91 80 4123 9000',
  websiteUrl: 'https://nidotech.in',
  socialLinks: 'https://linkedin.com/company/nidotech',
  copyrightText: '© 2026 Nido Technologies Pvt. Ltd. All rights reserved.',
};

export const INITIAL_EMAIL_LOGS: EmailActivityLogItem[] = [
  {
    id: 'log-1',
    subject: 'Tax Invoice Generated: INV-202600042 — ₹1,47,500.00',
    recipientName: 'Aarav Mehta',
    recipientEmail: 'aarav.mehta@clientcorp.in',
    recipientCategory: 'client',
    templateName: 'Tax Invoice Generated',
    triggerEvent: 'Tax Invoice Generated',
    sentAt: '2026-11-15T08:40:00.000Z',
    deliveryStatus: 'Sent',
    relatedTransactionId: 'INV-202600042',
  },
  {
    id: 'log-2',
    subject: 'New Purchase Order Received: PO-2026-0118 from Nido Technologies',
    recipientName: 'Rohan Kapoor',
    recipientEmail: 'orders@globalofficesupplies.in',
    recipientCategory: 'vendor',
    templateName: 'New Purchase Order Received',
    triggerEvent: 'New Purchase Order Received',
    sentAt: '2026-11-15T07:15:00.000Z',
    deliveryStatus: 'Queued',
    relatedTransactionId: 'PO-2026-0118',
  },
  {
    id: 'log-3',
    subject: 'Purchase Request Approval Required — Nido Technologies',
    recipientName: 'Priya Nair',
    recipientEmail: 'priya.nair@nidotech.in',
    recipientCategory: 'internal',
    templateName: 'Purchase Request Approval Required',
    triggerEvent: 'Purchase Request Approval Required',
    sentAt: '2026-11-14T16:20:00.000Z',
    deliveryStatus: 'Draft',
    relatedTransactionId: 'REQ-2026-0309',
  },
];

export function createInitialTransactionSettingsState(): TransactionSettingsStoreState {
  return {
    defaultTermsHtml: DEFAULT_TERMS_HTML,
    documentTerms: INITIAL_DOCUMENT_TERMS,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    signatures: INITIAL_SIGNATURES,
    signatureAssignments: INITIAL_SIGNATURE_ASSIGNMENTS,
    emailTemplates: INITIAL_EMAIL_TEMPLATES,
    emailBranding: INITIAL_EMAIL_BRANDING,
    emailLogs: INITIAL_EMAIL_LOGS,
  };
}

