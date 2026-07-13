// ── Centralized Configuration Service ─────────────────────────────────────────
// Single source of truth for all platform settings.
// Persists to localStorage. Fires a DOM event on every save so every
// subscriber (ConfigContext, ThemeContext, I18nProvider, etc.) updates
// automatically in real time — no page reload required.

export const CONFIG_STORAGE_KEY = "nido_general_settings";
export const CONFIG_CHANGED_EVENT = "nido:config-changed";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OrgSettings {
  companyName: string;
  displayName: string;
  gstNumber: string;
  panNumber: string;
  cin: string;
  registeredAddress: string;
  billingAddress: string;
  phone: string;
  supportPhone: string;
  email: string;
  supportEmail: string;
  website: string;
  industry: string;
  fiscalYearStart: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "system";
  accentColor: "blue" | "purple" | "green" | "orange";
  density: "comfortable" | "compact";
  fontSize: "small" | "medium" | "large";
}

export interface LocalizationSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  currencySymbol: string;
  numberFormat: string;
  weekStartDay: string;
  measurementUnit: string;
}

export interface ProcurementSettings {
  defaultCurrency: string;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  defaultShippingMethod: string;
  defaultGstPercent: string;
  defaultLeadTimeDays: string;
  defaultMOQ: string;
  defaultQuoteValidityDays: string;
  defaultOrderPriority: string;
  approvalThreshold: string;
  autoApproveUnderThreshold: boolean;
  requireVendorQuoteComparison: boolean;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  pushNotifications: boolean;
  orderStatusChanges: boolean;
  approvalRequests: boolean;
  budgetAlerts: boolean;
  weeklySummary: boolean;
  contractRenewalAlerts: boolean;
  slaAlerts: boolean;
  invoiceNotifications: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: string;
  passwordExpiryDays: string;
  maxLoginAttempts: string;
  accountLockDurationMinutes: string;
  requireStrongPasswords: boolean;
  ipAllowlist: string;
  auditLogging: boolean;
  fileUploadLimitMB: string;
  allowedFileTypes: string;
}

export interface GeneralSettings {
  organization: OrgSettings;
  theme: ThemeSettings;
  localization: LocalizationSettings;
  procurement: ProcurementSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

export const CONFIG_DEFAULTS: GeneralSettings = {
  organization: {
    companyName: "Nido Tech Pvt. Ltd.",
    displayName: "Nido Tech",
    gstNumber: "27AACCN1234A11ZD",
    panNumber: "AACCN1234A",
    cin: "",
    registeredAddress: "123 Corporate Ave, Chennai",
    billingAddress: "",
    phone: "+91-44-1234-5678",
    supportPhone: "",
    email: "info@nido-tech.com",
    supportEmail: "support@nido-tech.com",
    website: "www.nido-tech.com",
    industry: "Information Technology",
    fiscalYearStart: "April",
    logoUrl: "",
    faviconUrl: "",
  },
  theme: {
    mode: "light",
    accentColor: "blue",
    density: "comfortable",
    fontSize: "medium",
  },
  localization: {
    language: "English (India)",
    timezone: "Asia/Kolkata (IST, GMT+5:30)",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    currency: "INR (₹)",
    currencySymbol: "₹",
    numberFormat: "1,23,456.00 (Indian)",
    weekStartDay: "Monday",
    measurementUnit: "Metric",
  },
  procurement: {
    defaultCurrency: "INR (₹)",
    defaultPaymentTerms: "Net 30 (Payment due in 30 days)",
    defaultDeliveryTerms: "Ex-Works",
    defaultShippingMethod: "Standard Shipping",
    defaultGstPercent: "18",
    defaultLeadTimeDays: "14",
    defaultMOQ: "1",
    defaultQuoteValidityDays: "30",
    defaultOrderPriority: "Medium",
    approvalThreshold: "50000",
    autoApproveUnderThreshold: true,
    requireVendorQuoteComparison: true,
  },
  notifications: {
    email: true,
    sms: false,
    inApp: true,
    pushNotifications: false,
    orderStatusChanges: true,
    approvalRequests: true,
    budgetAlerts: true,
    weeklySummary: false,
    contractRenewalAlerts: true,
    slaAlerts: true,
    invoiceNotifications: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMinutes: "30",
    passwordExpiryDays: "90",
    maxLoginAttempts: "5",
    accountLockDurationMinutes: "15",
    requireStrongPasswords: true,
    ipAllowlist: "",
    auditLogging: true,
    fileUploadLimitMB: "25",
    allowedFileTypes: ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg",
  },
};

// ── Core Functions ─────────────────────────────────────────────────────────────

/** Load settings from localStorage, merged with defaults to handle schema evolution. */
export function loadConfig(): GeneralSettings {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return CONFIG_DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      organization: { ...CONFIG_DEFAULTS.organization, ...parsed.organization },
      theme: { ...CONFIG_DEFAULTS.theme, ...parsed.theme },
      localization: { ...CONFIG_DEFAULTS.localization, ...parsed.localization },
      procurement: { ...CONFIG_DEFAULTS.procurement, ...parsed.procurement },
      notifications: { ...CONFIG_DEFAULTS.notifications, ...parsed.notifications },
      security: { ...CONFIG_DEFAULTS.security, ...parsed.security },
    };
  } catch {
    return CONFIG_DEFAULTS;
  }
}

/** Save settings to localStorage and notify all subscribers. */
export function saveConfig(settings: GeneralSettings): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(settings));
  // Notify same-tab subscribers
  window.dispatchEvent(new CustomEvent(CONFIG_CHANGED_EVENT, { detail: settings }));
}

/** Get current config synchronously (alias for loadConfig). */
export function getConfig(): GeneralSettings {
  return loadConfig();
}

/**
 * Subscribe to config changes (both same-tab and cross-tab via storage event).
 * Returns an unsubscribe function.
 */
export function subscribeToConfig(
  callback: (settings: GeneralSettings) => void
): () => void {
  const onCustom = (e: Event) => {
    callback((e as CustomEvent<GeneralSettings>).detail);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONFIG_STORAGE_KEY) {
      callback(loadConfig());
    }
  };
  window.addEventListener(CONFIG_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONFIG_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract the symbol from a currency string like "INR (₹)" → "₹" */
export function parseCurrencySymbol(currency: string): string {
  const match = currency.match(/\((.+?)\)/);
  return match ? match[1] : currency;
}
