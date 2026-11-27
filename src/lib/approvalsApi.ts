import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import type {
  ApprovalCondition,
  ApprovalLevel,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalWorkflow,
} from '@/lib/approvalEngine';

interface DbWorkflowRow {
  id: string;
  client_id: string | null;
  client_name: string | null;
  name: string;
  description: string;
  module: string;
  trigger: string;
  workflow_type: string;
  status: 'Draft' | 'Active' | 'Inactive';
  current_version: number;
  conditions: ApprovalCondition[];
  levels: ApprovalLevel[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface DbRequestRow {
  id: string;
  workflow_id: string;
  workflow_name: string;
  workflow_version: number;
  client_id: string | null;
  client_name: string | null;
  module: string;
  trigger: string;
  reference: string;
  order_id: string | null;
  requested_by: string;
  requested_by_name: string;
  current_approver: string;
  approver_type: string | null;
  current_level: number;
  status: ApprovalStatus;
  amount: number | string | null;
  context: Record<string, unknown>;
  steps: unknown[];
  due_at: string | null;
  created_at: string;
  updated_at: string;
  approval_actions?: DbActionRow[] | null;
}

interface DbActionRow {
  id: string;
  request_id: string;
  step_id: string | null;
  action: string;
  user_id: string;
  user_name: string;
  user_role: string | null;
  comment: string;
  previous_status: string | null;
  new_status: string;
  created_at: string;
}

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export function mapDbWorkflowRow(row: DbWorkflowRow): ApprovalWorkflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    module: row.module,
    trigger: row.trigger || 'Order created',
    workflowType: row.workflow_type || 'Standard',
    status: row.status,
    currentVersion: row.current_version || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || 'system',
    updatedBy: row.updated_by || 'system',
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    levels: Array.isArray(row.levels) ? row.levels : [],
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? undefined,
  };
}

export function mapDbRequestRow(row: DbRequestRow): ApprovalRequest {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflow: row.workflow_name,
    workflowVersion: row.workflow_version,
    module: row.module,
    trigger: row.trigger,
    reference: row.reference,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name,
    currentApprover: row.current_approver,
    approverType: row.approver_type ?? undefined,
    currentLevel: row.current_level,
    status: row.status,
    amount: row.amount !== null ? Number(row.amount) : null,
    context: row.context || {},
    createdAt: row.created_at,
    dueAt: row.due_at,
    steps: Array.isArray(row.steps) ? row.steps : [],
    timeline: Array.isArray(row.approval_actions) ? row.approval_actions : [],
    clientId: row.client_id ?? undefined,
    clientName: row.client_name ?? undefined,
  };
}

export async function loadApprovalBootstrapFromSupabase(): Promise<{
  workflows: ApprovalWorkflow[];
  requests: ApprovalRequest[];
  stats: {
    total_workflows: number;
    active_workflows: number;
    draft_workflows: number;
    pending_approvals: number;
    completed_approvals: number;
    rejected_approvals: number;
    overdue_approvals: number;
  };
}> {
  assertSupabaseFrom();
  const [wfRes, reqRes] = await Promise.all([
    supabase.from('approval_workflows').select('*').order('updated_at', { ascending: false }),
    supabase
      .from('approval_requests')
      .select('*,approval_actions(*)')
      .order('created_at', { ascending: false }),
  ]);

  if (wfRes.error) throw new Error(wfRes.error.message);
  if (reqRes.error) throw new Error(reqRes.error.message);

  const workflows = (Array.isArray(wfRes.data) ? (wfRes.data as DbWorkflowRow[]) : []).map(mapDbWorkflowRow);
  const requests = (Array.isArray(reqRes.data) ? (reqRes.data as DbRequestRow[]) : []).map(mapDbRequestRow);

  const pending = requests.filter((r) => ['Pending', 'In Progress', 'Escalated'].includes(r.status));
  return {
    workflows,
    requests,
    stats: {
      total_workflows: workflows.length,
      active_workflows: workflows.filter((w) => w.status === 'Active').length,
      draft_workflows: workflows.filter((w) => w.status === 'Draft').length,
      pending_approvals: pending.length,
      completed_approvals: requests.filter((r) => r.status === 'Approved').length,
      rejected_approvals: requests.filter((r) => r.status === 'Rejected').length,
      overdue_approvals: pending.filter((r) => r.dueAt && new Date(r.dueAt).getTime() < Date.now()).length,
    },
  };
}

export async function saveApprovalWorkflowInSupabase(
  workflow: Partial<ApprovalWorkflow> & { name: string; module: string },
  editingId?: string,
): Promise<ApprovalWorkflow> {
  assertSupabaseFrom();
  const levels = Array.isArray(workflow.levels) ? workflow.levels : [];
  const conditions = Array.isArray(workflow.conditions) ? workflow.conditions : [];

  let savedRow: DbWorkflowRow;
  if (editingId && isSupabaseUuid(editingId)) {
    const { data: existing } = await supabase
      .from('approval_workflows')
      .select('current_version')
      .eq('id', editingId)
      .single();
    const nextVersion = ((existing as { current_version?: number } | null)?.current_version ?? 1) + 1;
    const { data, error } = await supabase
      .from('approval_workflows')
      .update({
        name: workflow.name.trim(),
        description: workflow.description ?? '',
        module: workflow.module,
        trigger: workflow.trigger || 'Order created',
        workflow_type: workflow.workflowType || 'Standard',
        status: workflow.status || 'Draft',
        current_version: nextVersion,
        conditions,
        levels,
        updated_by: workflow.updatedBy || 'system',
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    savedRow = data as DbWorkflowRow;
  } else {
    const { data, error } = await supabase
      .from('approval_workflows')
      .insert({
        client_id: workflow.clientId && isSupabaseUuid(workflow.clientId) ? workflow.clientId : null,
        client_name: workflow.clientName ?? null,
        name: workflow.name.trim(),
        description: workflow.description ?? '',
        module: workflow.module,
        trigger: workflow.trigger || 'Order created',
        workflow_type: workflow.workflowType || 'Standard',
        status: workflow.status || 'Draft',
        current_version: 1,
        conditions,
        levels,
        created_by: workflow.createdBy || workflow.updatedBy || 'system',
        updated_by: workflow.updatedBy || workflow.createdBy || 'system',
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    savedRow = data as DbWorkflowRow;
  }

  // Sync normalized steps & version history
  await supabase.from('approval_workflow_steps').delete().eq('workflow_id', savedRow.id);
  if (levels.length > 0) {
    await supabase.from('approval_workflow_steps').insert(
      levels.map((l, idx) => ({
        workflow_id: savedRow.id,
        level_number: l.levelNumber || idx + 1,
        approver_type: l.approverType,
        approver_role: l.approverRole ?? null,
        specific_user_id: l.specificUserId ?? null,
        minimum_approvers: l.minimumApprovers || 1,
        approval_mode: l.approvalMode || 'Sequential',
        sla_hours: l.slaHours || 24,
        escalation_enabled: Boolean(l.escalationEnabled),
        escalation_approver: l.escalationApprover ?? null,
        escalation_after_hours: l.escalationAfterHours ?? null,
      })),
    );
  }
  await supabase.from('approval_workflow_history').insert({
    workflow_id: savedRow.id,
    version: savedRow.current_version,
    changed_by: savedRow.updated_by,
    snapshot: { conditions, levels },
    status: 'Saved',
  });

  return mapDbWorkflowRow(savedRow);
}

export async function setApprovalWorkflowStatusInSupabase(
  id: string,
  status: ApprovalWorkflow['status'],
  updatedBy: string,
): Promise<ApprovalWorkflow> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('approval_workflows')
    .update({ status, updated_by: updatedBy || 'system', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapDbWorkflowRow(data as DbWorkflowRow);
}

export async function deleteApprovalWorkflowInSupabase(id: string): Promise<void> {
  assertSupabaseFrom();
  const { error } = await supabase.from('approval_workflows').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('This workflow has approval history and cannot be deleted. Deactivate it to preserve the audit trail.');
    }
    throw new Error(error.message);
  }
}

export async function getApprovalWorkflowHistoryFromSupabase(id: string) {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('approval_workflow_history')
    .select('*')
    .eq('workflow_id', id)
    .order('version', { ascending: false });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => ({
    version: r.version,
    changed_by: r.changed_by,
    date: r.created_at,
    snapshot: r.snapshot,
    status: r.status,
  }));
}
