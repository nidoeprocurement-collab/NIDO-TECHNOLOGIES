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

export interface AssignmentConfig {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string;
  tiers: AssignmentTierConfig[];
}

export interface AssignmentRosterEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  active: boolean;
  roleActive: boolean;
}

export interface AssignmentPreview {
  tier: AssignmentTierName;
  enabled: boolean;
  nextEmployeeId: string | null;
  assignments: Array<{
    order: number;
    employeeId: string | null;
    employeeName: string;
    fallback?: boolean;
  }>;
}

export interface AssignmentHistoryItem {
  id: number;
  assignment_id: string;
  order_id: string;
  client_id: string;
  client_name: string;
  client_tier: string;
  previous_employee_id: string | null;
  previous_employee_name: string | null;
  new_employee_id: string | null;
  new_employee_name: string | null;
  current_employee_id: string | null;
  current_employee_name: string | null;
  assignment_method: "Automatic" | "Manual";
  sequence_position: number | null;
  status: "assigned" | "unassigned" | "disabled" | "reassigned";
  reason: string;
  actor_name: string;
  actor_role: string;
  created_at: string;
}

export interface UnassignedOrder {
  assignment_id: string;
  order_id: string;
  message: string;
  created_at: string;
  client_id: string;
  client_name: string;
  client_tier: string;
  status: string;
  assigned_employee_id: string | null;
  assigned_employee_name: string | null;
}

export interface AutoAssignmentOrderResult {
  /** Server idempotency key; distinct from the locally displayed order number. */
  order_id: string;
  display_order_id: string;
  client_id: string;
  client_name: string;
  client_tier: string;
  assigned_employee_id: string | null;
  assigned_employee_name: string | null;
  assignment_method: "Automatic" | "Manual";
  sequence_position: number | null;
  status: "assigned" | "unassigned" | "disabled";
}

function headers(): HeadersInit {
  const result: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const rawUser = localStorage.getItem("nido_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (user?.id) result["x-nido-user-id"] = String(user.id);
    if (user?.name) result["x-nido-user-name"] = String(user.name);
    if (user?.role) result["x-nido-role"] = String(user.role);
    if (user?.userType) result["x-nido-user-type"] = String(user.userType);
    if (user?.clientId) result["x-nido-client-id"] = String(user.clientId);
  } catch {
    // The API will reject requests without a usable authenticated principal.
  }
  return result;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/auto-assignment${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error || `Assignment request failed (${response.status}).`);
  }
  return payload.data as T;
}

export const autoAssignmentApi = {
  getConfig: () => request<AssignmentConfig>("/settings"),
  saveConfig: (config: {
    enabled: boolean;
    tiers: AssignmentTierConfig[];
    employees: AssignmentRosterEmployee[];
  }) => request<AssignmentConfig>("/settings", { method: "PUT", body: JSON.stringify(config) }),
  syncEmployees: (employees: AssignmentRosterEmployee[]) =>
    request<{ success: boolean }>("/employees", { method: "PUT", body: JSON.stringify({ employees }) }),
  preview: () => request<AssignmentPreview[]>("/preview"),
  history: (filters: Record<string, string>) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => Boolean(value)),
    );
    return request<{ history: AssignmentHistoryItem[]; unassigned: UnassignedOrder[] }>(
      `/history${query.size ? `?${query.toString()}` : ""}`,
    );
  },
  assignOrder: (order: {
    assignmentId: string;
    orderId: string;
    clientId: string;
    clientName: string;
    clientTier: string;
    employees?: AssignmentRosterEmployee[];
  }) => request<AutoAssignmentOrderResult>("/orders/assign", {
    method: "POST",
    body: JSON.stringify(order),
  }),
  manuallyAssign: (assignmentId: string, employeeId: string, reason: string) =>
    request<AutoAssignmentOrderResult>(`/orders/${encodeURIComponent(assignmentId)}/assignment`, {
      method: "PUT",
      body: JSON.stringify({ employeeId, reason }),
    }),
};
