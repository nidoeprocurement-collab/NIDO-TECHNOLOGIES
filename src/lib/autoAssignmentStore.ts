export interface AutoAssignmentRule {
  id: string;
  department: string;
  role: string;
  assignedUserIds: string[];
  clientIds: string[];
}

export interface AutoAssignmentSettings {
  enabled: boolean;
  rules: AutoAssignmentRule[];
  updatedAt?: string;
}

export const AUTO_ASSIGNMENT_SETTINGS_KEY = "nido_auto_assignment_settings";
export const AUTO_ASSIGNMENT_EVENT = "nidoAutoAssignmentUpdated";

const DEFAULT_SETTINGS: AutoAssignmentSettings = {
  enabled: true,
  rules: [],
};

function createRuleId(): string {
  return `auto-rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRule(raw: Partial<AutoAssignmentRule>, index: number): AutoAssignmentRule {
  return {
    id: raw.id || `${createRuleId()}-${index}`,
    department: String(raw.department || ""),
    role: String(raw.role || ""),
    assignedUserIds: Array.isArray(raw.assignedUserIds)
      ? raw.assignedUserIds.map(String)
      : [],
    clientIds: Array.isArray(raw.clientIds)
      ? raw.clientIds.map(String)
      : [],
  };
}

export function getAutoAssignmentSettings(): AutoAssignmentSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS, rules: [] };

  try {
    const raw = localStorage.getItem(AUTO_ASSIGNMENT_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, rules: [] };

    const parsed = JSON.parse(raw) as Partial<AutoAssignmentSettings>;
    return {
      enabled: parsed.enabled !== false,
      rules: Array.isArray(parsed.rules)
        ? parsed.rules.map((rule, index) => normalizeRule(rule, index))
        : [],
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { ...DEFAULT_SETTINGS, rules: [] };
  }
}

export function saveAutoAssignmentSettings(settings: AutoAssignmentSettings): void {
  const next: AutoAssignmentSettings = {
    enabled: settings.enabled,
    rules: settings.rules.map((rule) => normalizeRule(rule, 0)),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTO_ASSIGNMENT_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(AUTO_ASSIGNMENT_EVENT));
}

export function createAutoAssignmentRule(
  values: Omit<AutoAssignmentRule, "id">,
): AutoAssignmentRule {
  return { ...values, id: createRuleId() };
}