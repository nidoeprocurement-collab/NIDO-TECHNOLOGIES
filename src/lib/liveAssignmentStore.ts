export type AssignmentTierName = "Premium" | "Medium" | "Standard";
export type AssignmentFallback = "unassigned_notify" | "fallback_employee";

export interface AssignmentEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  active: boolean;
  sequence: number;
}

export interface AssignmentTierConfig {
  tier: AssignmentTierName;
  enabled: boolean;
  nextEmployeeId: string | null;
  fallbackBehavior: AssignmentFallback;
  fallbackEmployeeId: string | null;
  employees: AssignmentEmployee[];
}

export interface AssignmentRosterEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  active: boolean;
  roleActive: boolean;
}

export interface AssignmentConfig {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string;
  tiers: AssignmentTierConfig[];
  employees?: AssignmentRosterEmployee[];
}

export interface LocalAssignmentResult {
  assignedEmployeeId: string | null;
  assignedEmployeeName: string | null;
  status: "assigned" | "unassigned" | "disabled";
}

const SETTINGS_KEY = "nido_live_auto_assignment_settings";
export const LIVE_ASSIGNMENT_UPDATED_EVENT = "nidoLiveAssignmentSettingsUpdated";

function normalizeTier(value: string): AssignmentTierName {
  const tier = value.trim().toLowerCase();
  if (tier === "premium") return "Premium";
  if (tier === "medium") return "Medium";
  return "Standard";
}

export function getLiveAssignmentConfig(): AssignmentConfig | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AssignmentConfig>;
    if (!Array.isArray(parsed.tiers)) return null;
    const tiers = parsed.tiers.flatMap((tier) => {
      if (!tier || !["Premium", "Medium", "Standard"].includes(tier.tier)) return [];
      return [{
        tier: tier.tier,
        enabled: tier.enabled !== false,
        nextEmployeeId: typeof tier.nextEmployeeId === "string" ? tier.nextEmployeeId : null,
        fallbackBehavior: tier.fallbackBehavior === "fallback_employee"
          ? "fallback_employee" as const
          : "unassigned_notify" as const,
        fallbackEmployeeId: typeof tier.fallbackEmployeeId === "string" ? tier.fallbackEmployeeId : null,
        employees: Array.isArray(tier.employees)
          ? tier.employees.filter((employee) => employee && typeof employee.id === "string")
          : [],
      }];
    });
    return {
      enabled: parsed.enabled !== false,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "local browser",
      tiers: tiers as AssignmentTierConfig[],
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
    };
  } catch {
    return null;
  }
}

export function saveLiveAssignmentConfig(
  config: Omit<AssignmentConfig, "updatedAt" | "updatedBy">,
): AssignmentConfig {
  const saved: AssignmentConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: "local browser",
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
  window.dispatchEvent(new Event(LIVE_ASSIGNMENT_UPDATED_EVENT));
  return saved;
}

export function assignOrderLocally(options: {
  clientTier: string;
  roster: AssignmentRosterEmployee[];
}): LocalAssignmentResult {
  const config = getLiveAssignmentConfig();
  if (!config) {
    return { assignedEmployeeId: null, assignedEmployeeName: null, status: "unassigned" };
  }
  if (!config.enabled) {
    return { assignedEmployeeId: null, assignedEmployeeName: null, status: "disabled" };
  }

  const tier = config.tiers.find((item) => item.tier === normalizeTier(options.clientTier));
  if (!tier || !tier.enabled) {
    return { assignedEmployeeId: null, assignedEmployeeName: null, status: "disabled" };
  }

  const activeById = new Map(
    options.roster
      .filter((employee) => employee.active && employee.roleActive)
      .map((employee) => [employee.id, employee]),
  );
  const sequence = [...tier.employees].sort((left, right) => left.sequence - right.sequence);
  const startIndex = Math.max(0, sequence.findIndex((employee) => employee.id === tier.nextEmployeeId));
  let selected: AssignmentRosterEmployee | undefined;
  let selectedIndex = -1;

  for (let offset = 0; offset < sequence.length; offset += 1) {
    const index = (startIndex + offset) % sequence.length;
    const employee = activeById.get(sequence[index].id);
    if (employee) {
      selected = employee;
      selectedIndex = index;
      break;
    }
  }

  if (selected && selectedIndex >= 0 && sequence.length) {
    const next = sequence[(selectedIndex + 1) % sequence.length];
    const savedConfig = getLiveAssignmentConfig();
    if (savedConfig) {
      savedConfig.tiers = savedConfig.tiers.map((item) =>
        item.tier === tier.tier ? { ...item, nextEmployeeId: next.id } : item,
      );
      savedConfig.updatedAt = new Date().toISOString();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedConfig));
      window.dispatchEvent(new Event(LIVE_ASSIGNMENT_UPDATED_EVENT));
    }
    return {
      assignedEmployeeId: selected.id,
      assignedEmployeeName: selected.name,
      status: "assigned",
    };
  }

  if (tier.fallbackBehavior === "fallback_employee" && tier.fallbackEmployeeId) {
    const fallback = activeById.get(tier.fallbackEmployeeId);
    if (fallback) {
      return {
        assignedEmployeeId: fallback.id,
        assignedEmployeeName: fallback.name,
        status: "assigned",
      };
    }
  }

  return { assignedEmployeeId: null, assignedEmployeeName: null, status: "unassigned" };
}
