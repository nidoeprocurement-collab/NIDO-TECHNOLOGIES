import { ROLE_PERMISSION_MODULE_OPTIONS } from "@/lib/platformModuleCatalog";

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: "page" | "record";
  path: string;
  searchText: string;
};

const SENSITIVE_KEY = /password|secret|token|cvv|card(number)?|account(number)?|ifsc|session/i;
const IGNORED_STORAGE_KEY = /^(nido_user|nido_role_permissions|nido_rbac_|nido_custom_modules|sidebar|theme|preferences|checkout)/i;

const routeHints: Array<[RegExp, string]> = [
  [/quote/, "/sales/quotes"],
  [/invoice/, "/invoices"],
  [/purchase.?order|^po/, "/purchase-orders"],
  [/bill/, "/bills"],
  [/expense/, "/expenses"],
  [/payment/, "/payment-receipts"],
  [/credit.?note/, "/credit-notes"],
  [/delivery.?challan/, "/delivery-challans"],
  [/eway/, "/eway-bills"],
  [/order/, "/orders"],
  [/vendor/, "/vendors"],
  [/client|portal/, "/clients"],
  [/contract/, "/contracts"],
  [/user|role/, "/configuration/nido-users"],
  [/report/, "/reports"],
  [/service/, "/services"],
  [/support|ticket/, "/support"],
  [/catalog|product/, "/master-catalogue"],
  [/location/, "/locations"],
  [/department/, "/departments"],
];

const titleKeys = [
  "name",
  "title",
  "subject",
  "number",
  "invoiceNumber",
  "quoteNumber",
  "orderNumber",
  "poNumber",
  "employeeId",
  "code",
  "sku",
  "email",
  "id",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeValue);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY.test(key))
        .map(([key, nestedValue]) => [key, safeValue(nestedValue)]),
    );
  }
  return value;
}

function textFromValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(textFromValue).join(" ");
  if (isObject(value)) {
    return Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, nestedValue]) => `${key} ${textFromValue(nestedValue)}`)
      .join(" ");
  }
  return "";
}

function getTitle(record: Record<string, unknown>, fallback: string): string {
  for (const key of titleKeys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return fallback;
}

function getSubtitle(record: Record<string, unknown>, storageKey: string): string {
  const preferredKeys = ["description", "status", "type", "clientName", "vendorName", "role", "department"];
  const parts = preferredKeys
    .map(key => record[key])
    .filter(value => typeof value === "string" || typeof value === "number")
    .map(String)
    .filter(Boolean)
    .slice(0, 2);
  return parts.length > 0 ? parts.join(" · ") : storageKey.replace(/[_-]+/g, " ");
}

function getStorageRoute(storageKey: string): string {
  const normalized = storageKey.toLowerCase();
  const hint = routeHints.find(([pattern]) => pattern.test(normalized));
  return hint?.[1] ?? "/dashboard";
}

function collectRecords(
  value: unknown,
  storageKey: string,
  records: Array<{ record: Record<string, unknown>; index: number }>,
  indexRef: { value: number },
): void {
  if (Array.isArray(value)) {
    value.forEach(item => collectRecords(item, storageKey, records, indexRef));
    return;
  }
  if (!isObject(value)) return;

  const hasIdentity = titleKeys.some(key => {
    const candidate = value[key];
    return typeof candidate === "string" || typeof candidate === "number";
  });
  if (hasIdentity) {
    records.push({ record: value, index: indexRef.value });
    indexRef.value += 1;
    return;
  }

  Object.values(value).forEach(nestedValue => {
    if (isObject(nestedValue) || Array.isArray(nestedValue)) {
      collectRecords(nestedValue, storageKey, records, indexRef);
    }
  });
}

function getPageResults(): GlobalSearchResult[] {
  return ROLE_PERMISSION_MODULE_OPTIONS
    .filter(module => !module.path.includes(":"))
    .map(module => ({
      id: `page:${module.path}`,
      title: module.label,
      subtitle: "Platform page",
      type: "page" as const,
      path: module.path,
      searchText: `${module.label} ${module.description} ${module.path}`.toLowerCase(),
    }));
}

function getRecordResults(): GlobalSearchResult[] {
  if (typeof window === "undefined") return [];

  const results: GlobalSearchResult[] = [];
  Object.keys(window.localStorage).forEach(storageKey => {
    if (IGNORED_STORAGE_KEY.test(storageKey)) return;

    let parsed: unknown;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const records: Array<{ record: Record<string, unknown>; index: number }> = [];
    collectRecords(parsed, storageKey, records, { value: 0 });
    records.forEach(({ record, index }) => {
      const sanitized = safeValue(record);
      const title = getTitle(record, storageKey.replace(/[_-]+/g, " "));
      const subtitle = getSubtitle(record, storageKey);
      results.push({
        id: `record:${storageKey}:${index}`,
        title,
        subtitle,
        type: "record",
        path: getStorageRoute(storageKey),
        searchText: `${title} ${subtitle} ${storageKey} ${textFromValue(sanitized)}`.toLowerCase(),
      });
    });
  });
  return results;
}

export function searchGlobalPlatform(query: string): GlobalSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return [...getPageResults(), ...getRecordResults()]
    .filter(result => terms.every(term => result.searchText.includes(term)))
    .sort((first, second) => {
      const firstTitle = first.title.toLowerCase();
      const secondTitle = second.title.toLowerCase();
      const firstScore = firstTitle === normalizedQuery ? 3 : firstTitle.startsWith(normalizedQuery) ? 2 : 1;
      const secondScore = secondTitle === normalizedQuery ? 3 : secondTitle.startsWith(normalizedQuery) ? 2 : 1;
      return secondScore - firstScore || first.title.localeCompare(second.title);
    })
    .slice(0, 40);
}