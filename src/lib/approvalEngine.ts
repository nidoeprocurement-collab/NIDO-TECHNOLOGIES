export type ApprovalStatus = "Pending" | "In Progress" | "Approved" | "Rejected" | "Sent Back" | "Cancelled" | "Escalated";

export interface ApprovalCondition {
  joinOperator: "AND" | "OR";
  field: string;
  operator: string;
  value: string | number | string[];
}

export interface ApprovalLevel {
  levelNumber: number;
  approverType: "Role" | "Specific User" | "Department" | "Manager" | "Reporting Manager";
  approverRole?: string;
  specificUserId?: string;
  minimumApprovers: number;
  approvalMode: "Sequential" | "Parallel" | "Any One" | "All Required" | "Majority";
  slaHours: number;
  escalationEnabled: boolean;
  escalationApprover?: string;
  escalationAfterHours?: number;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  module: string;
  trigger: string;
  workflowType: string;
  status: "Draft" | "Active" | "Inactive";
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  conditions: ApprovalCondition[];
  levels: ApprovalLevel[];
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  workflow: string;
  workflowVersion: number;
  module: string;
  trigger: string;
  reference: string;
  requestedBy: string;
  requestedByName: string;
  currentApprover: string;
  currentLevel: number;
  status: ApprovalStatus;
  amount?: number | null;
  context: Record<string, unknown>;
  createdAt: string;
  dueAt?: string | null;
  timeline?: any[];
  steps?: any[];
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let role = "";
  try {
    role = JSON.parse(localStorage.getItem("nido_user") || "null")?.role || "";
  } catch {
    // The backend will reject protected operations when no role is available.
  }
  const response = await fetch(`/api/approvals${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(role ? { "x-nido-role": role } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error || "Approval service unavailable.");
  return payload.data as T;
}

export async function loadApprovalBootstrap() {
  return api<{ workflows: ApprovalWorkflow[]; requests: ApprovalRequest[]; stats: Record<string, number> }>("/bootstrap");
}

export async function saveApprovalWorkflow(workflow: Partial<ApprovalWorkflow> & { name: string; module: string }, editingId?: string) {
  return api<ApprovalWorkflow>(editingId ? `/workflows/${editingId}` : "/workflows", {
    method: editingId ? "PUT" : "POST",
    body: JSON.stringify(workflow),
  });
}

export async function setApprovalWorkflowStatus(id: string, status: ApprovalWorkflow["status"], updatedBy: string) {
  return api<ApprovalWorkflow>(`/workflows/${id}/status`, { method: "POST", body: JSON.stringify({ status, updatedBy }) });
}

export async function duplicateApprovalWorkflow(id: string, createdBy: string) {
  return api<ApprovalWorkflow>(`/workflows/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ createdBy, actorRole: currentRole() }),
  });
}

export async function deleteApprovalWorkflow(id: string) {
  return api<void>(`/workflows/${id}`, { method: "DELETE" });
}

export async function createApprovalRequest(payload: Record<string, unknown>) {
  return api<ApprovalRequest[]>("/requests/evaluate", { method: "POST", body: JSON.stringify(payload) });
}

export async function actOnApprovalRequest(id: string, payload: Record<string, unknown>) {
  return api<ApprovalRequest>(`/requests/${id}/action`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getApprovalRequest(id: string) {
  return api<ApprovalRequest>(`/requests/${id}`);
}

export async function getApprovalWorkflowHistory(id: string) {
  return api<unknown[]>(`/workflows/${id}/history`);
}

function currentRole(): string {
  try {
    return JSON.parse(localStorage.getItem("nido_user") || "null")?.role || "";
  } catch {
    return "";
  }
}