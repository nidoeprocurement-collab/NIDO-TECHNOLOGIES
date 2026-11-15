import { createInitialTransactionSettingsState, DYNAMIC_VARIABLES } from './mockData';
import type {
  BankAccountSetting,
  DigitalSignatureSetting,
  DocumentSignatureAssignment,
  DocumentTermsSetting,
  EmailActivityLogItem,
  EmailBrandingSetting,
  EmailTemplateSetting,
  TransactionSettingsStoreState,
} from './types';

// Temporary frontend-only storage key. Replace these service methods with API calls during backend integration.
const STORAGE_KEY = 'nido_transaction_settings_frontend_v1';

export function loadTransactionSettings(): TransactionSettingsStoreState {
  const fallback = createInitialTransactionSettingsState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<TransactionSettingsStoreState>;
    return {
      defaultTermsHtml: parsed.defaultTermsHtml ?? fallback.defaultTermsHtml,
      documentTerms: Array.isArray(parsed.documentTerms) && parsed.documentTerms.length > 0
        ? parsed.documentTerms
        : fallback.documentTerms,
      bankAccounts: Array.isArray(parsed.bankAccounts)
        ? parsed.bankAccounts
        : fallback.bankAccounts,
      signatures: Array.isArray(parsed.signatures)
        ? parsed.signatures
        : fallback.signatures,
      signatureAssignments: Array.isArray(parsed.signatureAssignments) && parsed.signatureAssignments.length > 0
        ? parsed.signatureAssignments
        : fallback.signatureAssignments,
      emailTemplates: Array.isArray(parsed.emailTemplates) && parsed.emailTemplates.length > 0
        ? parsed.emailTemplates
        : fallback.emailTemplates,
      emailBranding: parsed.emailBranding ? { ...fallback.emailBranding, ...parsed.emailBranding } : fallback.emailBranding,
      emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : fallback.emailLogs,
    };
  } catch {
    return fallback;
  }
}

export function saveTransactionSettings(state: TransactionSettingsStoreState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in frontend prototype mode
  }
}

export function validateIfscCode(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase());
}

export function validateAccountNumber(accountNumber: string): boolean {
  return /^[0-9]{6,22}$/.test(accountNumber.trim());
}

export function validateSwiftCode(swift: string): boolean {
  if (!swift.trim()) return true;
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift.trim().toUpperCase());
}

export function validateImageUpload(
  file: File,
  maxBytes: number = 2 * 1024 * 1024,
): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Only PNG, JPG, or JPEG images are supported.' };
  }
  if (file.size > maxBytes) {
    return { valid: false, error: `File size must be under ${(maxBytes / (1024 * 1024)).toFixed(1)} MB.` };
  }
  return { valid: true };
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function resolveDynamicVariablesWithSamples(text: string): {
  resolved: string;
  unresolvedTokens: string[];
} {
  let resolved = text;
  for (const item of DYNAMIC_VARIABLES) {
    resolved = resolved.split(item.token).join(item.sampleValue);
  }
  const matches = resolved.match(/\{\{[a-z0-9_]+\}\}/gi) || [];
  return {
    resolved,
    unresolvedTokens: Array.from(new Set(matches)),
  };
}

export function stripHtmlToPlainText(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  return (tmp.textContent || tmp.innerText || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function createDocumentTermsSnapshot(
  termsList: DocumentTermsSetting[],
  documentType: string,
): { termsHtml: string; version: number; isEnabled: boolean } | null {
  const found = termsList.find((item) => item.documentType === documentType);
  if (!found) return null;
  return {
    termsHtml: found.termsHtml,
    version: found.currentVersion,
    isEnabled: found.isEnabled,
  };
}

export function getDefaultBankAccount(accounts: BankAccountSetting[]): BankAccountSetting | undefined {
  return accounts.find((a) => a.isDefault && a.isActive) || accounts.find((a) => a.isActive);
}

export function getAssignedSignatureForDocument(
  documentType: string,
  signatures: DigitalSignatureSetting[],
  assignments: DocumentSignatureAssignment[],
): {
  signature?: DigitalSignatureSetting;
  assignment?: DocumentSignatureAssignment;
} {
  const assignment = assignments.find((a) => a.documentType === documentType);
  if (assignment && !assignment.isEnabled) {
    return { assignment };
  }
  const matchedSignature = assignment
    ? signatures.find((s) => s.id === assignment.signatureId && s.isActive)
    : undefined;
  const fallbackSignature = signatures.find((s) => s.isDefault && s.isActive) || signatures.find((s) => s.isActive);
  return {
    signature: matchedSignature || fallbackSignature,
    assignment,
  };
}

export function appendSimulatedEmailLog(
  logs: EmailActivityLogItem[],
  entry: Omit<EmailActivityLogItem, 'id' | 'sentAt'>,
): EmailActivityLogItem[] {
  const next: EmailActivityLogItem = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sentAt: new Date().toISOString(),
  };
  return [next, ...logs].slice(0, 100);
}

export function updateEmailBranding(
  current: EmailBrandingSetting,
  patch: Partial<EmailBrandingSetting>,
): EmailBrandingSetting {
  return { ...current, ...patch };
}

export function upsertTemplate(
  templates: EmailTemplateSetting[],
  template: EmailTemplateSetting,
): EmailTemplateSetting[] {
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    return templates.map((t) => (t.id === template.id ? template : t));
  }
  return [template, ...templates];
}

