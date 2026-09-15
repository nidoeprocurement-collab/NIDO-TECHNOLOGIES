import { pool } from "../db.js";
import { sendEmail } from "./emailService.js";

const ACTIONS = new Set(["approve", "reject", "send_back", "request_changes", "delegate", "reassign", "cancel"]);
const TERMINAL = new Set(["Approved", "Rejected", "Cancelled"]);

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function asSnapshot(body) {
  return {
    conditions: Array.isArray(body.conditions) ? body.conditions : [],
    levels: Array.isArray(body.levels) && body.levels.length ? body.levels : [{
      levelNumber: 1, approverType: "Role", approverRole: "System Admin",
      minimumApprovers: 1, approvalMode: "Sequential", slaHours: 24,
      escalationEnabled: false, escalationApprover: "", escalationAfterHours: 24,
    }],
  };
}

function compare(actual, operator, expected) {
  if (operator === "contains") return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
  if (operator === "between") {
    const [min, max] = Array.isArray(expected) ? expected : String(expected ?? "").split(",").map(Number);
    return Number(actual) >= Number(min) && Number(actual) <= Number(max);
  }
  const a = typeof actual === "number" ? actual : Number(actual);
  const b = typeof expected === "number" ? expected : Number(expected);
  const numeric = Number.isFinite(a) && Number.isFinite(b) && actual !== "" && expected !== "";
  const left = numeric ? a : String(actual ?? "").toLowerCase();
  const right = numeric ? b : String(expected ?? "").toLowerCase();
  switch (operator) {
    case "equals": return left === right;
    case "not_equals": return left !== right;
    case "greater_than": return left > right;
    case "greater_or_equal": return left >= right;
    case "less_than": return left < right;
    case "less_or_equal": return left <= right;
    default: return false;
  }
}

export function conditionsMatch(conditions, context = {}) {
  if (!conditions?.length) return true;
  let result = compare(context[conditions[0].field], conditions[0].operator, conditions[0].value);
  for (let i = 1; i < conditions.length; i += 1) {
    const next = compare(context[conditions[i].field], conditions[i].operator, conditions[i].value);
    result = conditions[i].joinOperator === "OR" ? result || next : result && next;
  }
  return result;
}

function mapVersion(row) {
  if (!row) return null;
  const snapshot = row.snapshot || {};
  return {
    version: Number(row.version),
    conditions: snapshot.conditions || [],
    levels: snapshot.levels || [],
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

async function getLatestVersion(workflowId, version) {
  const { rows } = await pool.query(
    `SELECT version, snapshot, created_at, created_by
     FROM approval_workflow_versions
     WHERE workflow_id = $1 AND version = COALESCE($2, (SELECT current_version FROM approval_workflows WHERE id = $1))
     LIMIT 1`,
    [workflowId, version ?? null],
  );
  return mapVersion(rows[0]);
}

function workflowResponse(row, version) {
  return {
    id: row.id, name: row.name, description: row.description, module: row.module,
    trigger: row.trigger,
    workflowType: row.workflow_type, status: row.status, currentVersion: row.current_version,
    createdAt: row.created_at, updatedAt: row.updated_at, createdBy: row.created_by, updatedBy: row.updated_by,
    clientId: row.client_id || undefined, clientName: row.client_name || undefined,
    conditions: version?.conditions || [], levels: version?.levels || [],
  };
}

export async function listWorkflows(clientId) {
  const { rows } = await pool.query(
    clientId
      ? "SELECT * FROM approval_workflows WHERE client_id=$1 ORDER BY updated_at DESC"
      : "SELECT * FROM approval_workflows ORDER BY updated_at DESC",
    clientId ? [clientId] : [],
  );
  return Promise.all(rows.map(async row => workflowResponse(row, await getLatestVersion(row.id))));
}

export async function getWorkflow(id) {
  const { rows } = await pool.query("SELECT * FROM approval_workflows WHERE id = $1", [id]);
  return rows[0] ? workflowResponse(rows[0], await getLatestVersion(id)) : null;
}

async function writeVersion(client, workflowId, version, snapshot, createdBy) {
  await client.query(
    `INSERT INTO approval_workflow_versions (workflow_id, version, snapshot, created_by)
     VALUES ($1,$2,$3,$4)`,
    [workflowId, version, JSON.stringify(snapshot), createdBy],
  );
  await client.query("DELETE FROM approval_workflow_conditions WHERE workflow_id = $1 AND version = $2", [workflowId, version]);
  for (const [position, condition] of snapshot.conditions.entries()) {
    await client.query(
      `INSERT INTO approval_workflow_conditions
       (workflow_id, version, position, join_operator, field, operator, value)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [workflowId, version, position, condition.joinOperator || "AND", condition.field, condition.operator, JSON.stringify(condition.value)],
    );
  }
  for (const [index, level] of snapshot.levels.entries()) {
    await client.query(
      `INSERT INTO approval_workflow_levels
       (workflow_id, version, level_number, approver_type, approver_role, specific_user_id,
        minimum_approvers, approval_mode, sla_hours, escalation_enabled, escalation_approver, escalation_after_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [workflowId, version, level.levelNumber || index + 1, level.approverType || "Role",
        level.approverRole || null, level.specificUserId || null, level.minimumApprovers || 1,
        level.approvalMode || "Sequential", level.slaHours || 24, Boolean(level.escalationEnabled),
        level.escalationApprover || null, level.escalationAfterHours || null],
    );
  }
}

export async function createWorkflow(body) {
  const name = String(body.name || "").trim();
  if (!name || !body.module) throw new Error("Workflow name and module are required.");
  const workflowId = id("wf");
  const actor = body.updatedBy || body.createdBy || "system";
  const snapshot = asSnapshot(body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO approval_workflows
        (id,name,description,module,trigger,workflow_type,status,created_by,updated_by,client_id,client_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10)`,
      [workflowId, name, body.description || "", body.module, body.trigger || "Manual submission",
        body.workflowType || "Standard", body.status || "Draft", actor,
        body.clientId || null, body.clientName || null],
    );
    await writeVersion(client, workflowId, 1, snapshot, actor);
    await client.query(
      `INSERT INTO approval_audit_log (workflow_id, action, user_id, user_name, new_value)
       VALUES ($1,'created',$2,$2,$3)`,
      [workflowId, actor, JSON.stringify({ name, module: body.module, version: 1 })],
    );
    await client.query("COMMIT");
    return getWorkflow(workflowId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateWorkflow(workflowId, body) {
  const existing = await getWorkflow(workflowId);
  if (!existing) return null;
  const actor = body.updatedBy || "system";
  const version = existing.currentVersion + 1;
  const snapshot = asSnapshot(body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
        `UPDATE approval_workflows SET name=$2, description=$3, module=$4, trigger=$5, workflow_type=$6,
        status=$7, current_version=$8, updated_at=now(), updated_by=$9, client_id=$10, client_name=$11 WHERE id=$1`,
      [workflowId, body.name ?? existing.name, body.description ?? existing.description,
        body.module ?? existing.module, body.trigger ?? existing.trigger, body.workflowType ?? existing.workflowType,
        body.status ?? existing.status, version, actor,
        body.clientId ?? existing.clientId ?? null, body.clientName ?? existing.clientName ?? null],
    );
    await writeVersion(client, workflowId, version, snapshot, actor);
    await client.query(
      `INSERT INTO approval_audit_log
       (workflow_id, action, user_id, user_name, old_value, new_value)
       VALUES ($1,'version_created',$2,$2,$3,$4)`,
      [workflowId, actor, JSON.stringify({ version: existing.currentVersion }), JSON.stringify({ version })],
    );
    await client.query("COMMIT");
    return getWorkflow(workflowId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function changeWorkflowStatus(workflowId, status, actor = "system") {
  if (!["Active", "Inactive", "Draft"].includes(status)) throw new Error("Invalid workflow status.");
  const { rows } = await pool.query(
    "UPDATE approval_workflows SET status=$2, updated_at=now(), updated_by=$3 WHERE id=$1 RETURNING *",
    [workflowId, status, actor],
  );
  if (rows[0]) {
    await pool.query(
      `INSERT INTO approval_audit_log (workflow_id, action, user_id, user_name, new_value)
       VALUES ($1,$2,$3,$3,$4)`,
      [workflowId, status === "Active" ? "activated" : status === "Inactive" ? "deactivated" : "status_changed", actor, JSON.stringify({ status })],
    );
  }
  return rows[0] ? workflowResponse(rows[0], await getLatestVersion(workflowId)) : null;
}

export async function deleteWorkflow(workflowId) {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM approval_requests WHERE workflow_id=$1",
    [workflowId],
  );
  if (rows[0]?.count > 0) throw new Error("This workflow has approval history and cannot be deleted. Deactivate it to preserve the audit trail.");
  const result = await pool.query("DELETE FROM approval_workflows WHERE id=$1", [workflowId]);
  return result.rowCount > 0;
}

export async function duplicateWorkflow(workflowId, actor = "system") {
  const existing = await getWorkflow(workflowId);
  if (!existing) return null;
  return createWorkflow({
    name: `${existing.name} (Copy)`, description: existing.description, module: existing.module,
    trigger: existing.trigger, workflowType: existing.workflowType, status: "Draft", conditions: existing.conditions,
    levels: existing.levels, clientId: existing.clientId, clientName: existing.clientName, createdBy: actor,
  });
}

export async function evaluateAndCreate(payload) {
  const isClientPortalPayload = ["client_admin", "client_user"].includes(String(payload.userType || ""));
  const { rows: candidates } = await pool.query(
    `SELECT * FROM approval_workflows
     WHERE module=$1
       AND status='Active'
       AND trigger=$2
       AND (
         ($4::boolean = true AND $3::text IS NOT NULL AND client_id=$3)
         OR ($4::boolean = false AND COALESCE(client_id,'')='')
       )
     ORDER BY updated_at DESC`,
    [payload.module, payload.trigger || "Manual submission", payload.clientId || null, isClientPortalPayload],
  );
  const created = [];
  for (const workflow of candidates) {
    const version = await getLatestVersion(workflow.id);
    const context = { ...(payload.context || {}), amount: payload.amount, module: payload.module, trigger: payload.trigger };
    if (!conditionsMatch(version?.conditions, context)) continue;
    const requestId = id("apr");
    const levels = version?.levels || [];
    if (!levels.length) continue;
    const first = levels[0];
    const dueAt = new Date(Date.now() + (Number(first.slaHours) || 24) * 3600000);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query(
        `SELECT id FROM approval_requests
         WHERE workflow_id=$1 AND reference=$2
           AND status IN ('Pending','In Progress','Sent Back','Escalated')
         LIMIT 1`,
        [workflow.id, payload.reference || ""],
      );
      if (existing.rows.length) {
        const existingRequest = await getRequest(existing.rows[0].id);
        if (existingRequest) created.push(existingRequest);
        await client.query("ROLLBACK");
        continue;
      }
      await client.query(
        `INSERT INTO approval_requests
         (id,workflow_id,workflow_version,module,trigger,reference,requested_by,requested_by_name,current_level,status,amount,context,client_id,client_name,due_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,'Pending',$9,$10,$11,$12,$13)`,
        [requestId, workflow.id, version.version, payload.module, payload.trigger || "", payload.reference || "",
          payload.requestedBy || "system", payload.requestedByName || "System", payload.amount ?? null,
          JSON.stringify(context), payload.clientId || null, payload.clientName || null, dueAt],
      );
      for (const level of levels) {
        await client.query(
          `INSERT INTO approval_request_steps
           (request_id,level_number,approver_type,approver_role,specific_user_id,minimum_approvers,approval_mode,
            sla_hours,escalation_enabled,escalation_approver,escalation_after_hours,status,due_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [requestId, level.levelNumber, level.approverType || "Role", level.approverRole || null,
            level.specificUserId || null, level.minimumApprovers || 1, level.approvalMode || "Sequential",
            level.slaHours || 24, Boolean(level.escalationEnabled), level.escalationApprover || null,
            level.escalationAfterHours || null, level.levelNumber === 1 ? "Pending" : "Waiting", level.levelNumber === 1 ? dueAt : null],
        );
      }
      await client.query(
        `INSERT INTO approval_actions
         (request_id,action,user_id,user_name,user_role,comment,previous_status,new_status)
         VALUES ($1,'submitted',$2,$3,$4,'','', 'Pending')`,
        [requestId, payload.requestedBy || "system", payload.requestedByName || "System", payload.requestedByRole || ""],
      );
      await client.query(
        `INSERT INTO approval_audit_log (request_id, workflow_id, action, user_id, user_name, user_role, new_value)
         VALUES ($1,$2,'approval_assigned',$3,$4,$5,$6)`,
        [requestId, workflow.id, payload.requestedBy || "system", payload.requestedByName || "System",
          payload.requestedByRole || "", JSON.stringify({ level: 1, approver: first.approverRole || first.specificUserId || first.approverType })],
      );
      await client.query("COMMIT");
      const request = await getRequest(requestId);
      created.push(request);
      await notifyApprovers(payload, requestId, workflow, first);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  return created;
}

function requestSelect() {
  return `SELECT r.*, w.name AS workflow_name,
    s.approver_role, s.specific_user_id, s.approver_type, s.due_at AS step_due_at,
    s.status AS step_status, s.id AS step_id
    FROM approval_requests r
    JOIN approval_workflows w ON w.id=r.workflow_id
    LEFT JOIN approval_request_steps s ON s.request_id=r.id AND s.level_number=r.current_level`;
}

export async function listRequests(status, clientId) {
  const params = [];
  const clauses = [];
  if (status) {
    params.push(status);
    clauses.push(`r.status=$${params.length}`);
  }
  if (clientId) {
    params.push(clientId);
    clauses.push(`r.client_id=$${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query(`${requestSelect()} ${where} ORDER BY r.created_at DESC`, params);
  return rows.map(mapRequest);
}

function mapRequest(row) {
  return {
    id: row.id, workflowId: row.workflow_id, workflow: row.workflow_name, workflowVersion: row.workflow_version,
    module: row.module, trigger: row.trigger, reference: row.reference, requestedBy: row.requested_by,
    requestedByName: row.requested_by_name, currentApprover: row.specific_user_id || row.approver_role || "—",
    approverType: row.approver_type, currentLevel: row.current_level, status: row.status,
    amount: row.amount == null ? null : Number(row.amount), context: row.context || {},
    clientId: row.client_id || undefined, clientName: row.client_name || undefined,
    createdAt: row.created_at, dueAt: row.step_due_at || row.due_at,
  };
}

export async function getRequest(requestId) {
  const { rows } = await pool.query(`${requestSelect()} WHERE r.id=$1`, [requestId]);
  if (!rows[0]) return null;
  const { rows: timeline } = await pool.query(
    "SELECT * FROM approval_actions WHERE request_id=$1 ORDER BY created_at ASC, id ASC", [requestId],
  );
  const { rows: steps } = await pool.query(
    "SELECT * FROM approval_request_steps WHERE request_id=$1 ORDER BY level_number ASC", [requestId],
  );
  return { ...mapRequest(rows[0]), timeline, steps };
}

function requiredApprovals(step) {
  const minimum = Math.max(1, Number(step?.minimum_approvers) || 1);
  if (step?.approval_mode === "Any One") return 1;
  if (step?.approval_mode === "Majority") return Math.max(1, Math.ceil(minimum / 2));
  return minimum;
}

export async function takeAction(requestId, body) {
  const action = String(body.action || "");
  if (!ACTIONS.has(action)) throw new Error("Unsupported approval action.");
  const request = await getRequest(requestId);
  if (!request) return null;
  if (TERMINAL.has(request.status)) throw new Error("This approval request is already complete.");
  if (["reject", "send_back", "request_changes"].includes(action) && !String(body.comment || "").trim()) {
    throw new Error("A reason is required for this action.");
  }
  if (["delegate", "reassign"].includes(action) && !String(body.targetUserId || "").trim()) {
    throw new Error("A target user is required for delegation or reassignment.");
  }
  const step = request.steps.find(s => Number(s.level_number) === Number(request.currentLevel));
  const actorRole = body.userRole || "";
  const actorId = body.userId || "system";
  const sameClient = Boolean(request.clientId && body.clientId && request.clientId === String(body.clientId));
  const clientAdmin = ["client_admin", "client_user"].includes(String(body.userType || ""))
    && sameClient
    && String(body.userType || "") === "client_admin";
  const authorized = actorRole === "System Owner" ||
    clientAdmin ||
    (action === "cancel" && (String(actorId) === String(request.requestedBy) || actorRole === "System Admin")) ||
    (step?.approver_type === "Role" && step.approver_role === actorRole) ||
    (step?.approver_type === "Specific User" && step.specific_user_id === actorId) ||
    (step?.approver_type === "Department" && step.approver_role === body.userDepartment) ||
    (["Manager", "Reporting Manager"].includes(step?.approver_type)
      && String(request.context?.managerId || request.context?.reportingManagerId || "") === String(actorId));
  if (!authorized) throw new Error("You are not an eligible approver for the current level.");

  const priorApproverIds = new Set(
    (request.timeline || [])
      .filter(entry => entry.action === "approve" && String(entry.step_id) === String(step?.id))
      .map(entry => String(entry.user_id || entry.user_name)),
  );
  if (action === "approve" && priorApproverIds.has(String(actorId))) {
    throw new Error("You have already approved this approval level.");
  }
  const approvalCount = priorApproverIds.size + (action === "approve" ? 1 : 0);
  const stepApprovalComplete = action === "approve" && approvalCount >= requiredApprovals(step);

  let newStatus = request.status;
  let nextLevel = request.currentLevel;
  if (action === "approve" && stepApprovalComplete) {
    if (request.currentLevel >= request.steps.length) newStatus = "Approved";
    else { nextLevel += 1; newStatus = "In Progress"; }
  } else if (action === "reject") newStatus = "Rejected";
  else if (action === "send_back" || action === "request_changes") newStatus = "Sent Back";
  else if (action === "delegate" || action === "reassign") newStatus = "In Progress";
  else if (action === "cancel") newStatus = "Cancelled";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (action === "approve" && !stepApprovalComplete) {
      await client.query(
        "UPDATE approval_request_steps SET status='Pending', decided_by=NULL, decided_at=NULL WHERE id=$1",
        [step.id],
      );
    } else {
      await client.query(
        `UPDATE approval_request_steps SET status=$2, decided_by=$3, decided_at=now() WHERE id=$1`,
        [step.id, action === "approve" ? "Approved" : action === "reject" ? "Rejected" : action === "cancel" ? "Cancelled" : "Actioned", actorId],
      );
    }
    if (["delegate", "reassign"].includes(action)) {
      await client.query(
        `INSERT INTO approval_delegations
         (request_id, step_id, from_user_id, to_user_id, reason)
         VALUES ($1,$2,$3,$4,$5)`,
        [requestId, step.id, actorId, body.targetUserId, body.comment || ""],
      );
      await client.query(
        `UPDATE approval_request_steps
         SET approver_type='Specific User', specific_user_id=$2, approver_role=NULL, status='Pending'
         WHERE id=$1`,
        [step.id, body.targetUserId],
      );
    }
    if (action === "approve" && stepApprovalComplete && newStatus === "In Progress") {
      const next = request.steps.find(s => Number(s.level_number) === nextLevel);
      const due = new Date(Date.now() + (Number(next.sla_hours) || 24) * 3600000);
      await client.query(
        "UPDATE approval_request_steps SET status='Pending', due_at=$2 WHERE request_id=$1 AND level_number=$3",
        [requestId, due, nextLevel],
      );
      await client.query("UPDATE approval_requests SET current_level=$2, status=$3, due_at=$4 WHERE id=$1", [requestId, nextLevel, newStatus, due]);
    } else {
      await client.query(
        "UPDATE approval_requests SET status=$2, completed_at=CASE WHEN $2 IN ('Approved','Rejected') THEN now() ELSE completed_at END WHERE id=$1",
        [requestId, newStatus],
      );
    }
    await client.query(
      `INSERT INTO approval_actions
       (request_id,step_id,action,user_id,user_name,user_role,comment,previous_status,new_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [requestId, step.id, action, actorId, body.userName || actorId, actorRole,
        body.comment || "", request.status, newStatus],
    );
    await client.query(
      `INSERT INTO approval_audit_log
       (request_id, action, user_id, user_name, user_role, old_value, new_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [requestId, `approval_${action}`, actorId, body.userName || actorId, actorRole,
        JSON.stringify({ status: request.status }), JSON.stringify({ status: newStatus, level: nextLevel })],
    );
    await client.query("COMMIT");
    return getRequest(requestId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function dashboard(clientId) {
  const requestFilter = clientId ? "WHERE client_id=$1" : "";
  const workflowFilter = clientId ? "WHERE client_id=$1" : "";
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM approval_workflows ${workflowFilter}) AS total_workflows,
      (SELECT COUNT(*)::int FROM approval_workflows ${workflowFilter ? `${workflowFilter} AND status='Active'` : "WHERE status='Active'"}) AS active_workflows,
      (SELECT COUNT(*)::int FROM approval_workflows ${workflowFilter ? `${workflowFilter} AND status='Draft'` : "WHERE status='Draft'"}) AS draft_workflows,
      (SELECT COUNT(*)::int FROM approval_requests ${requestFilter ? `${requestFilter} AND status IN ('Pending','In Progress','Escalated')` : "WHERE status IN ('Pending','In Progress','Escalated')"}) AS pending_approvals,
      (SELECT COUNT(*)::int FROM approval_requests ${requestFilter ? `${requestFilter} AND status='Approved'` : "WHERE status='Approved'"}) AS completed_approvals,
      (SELECT COUNT(*)::int FROM approval_requests ${requestFilter ? `${requestFilter} AND status='Rejected'` : "WHERE status='Rejected'"}) AS rejected_approvals,
      (SELECT COUNT(*)::int FROM approval_requests ${requestFilter ? `${requestFilter} AND due_at < now() AND status IN ('Pending','In Progress','Escalated')` : "WHERE due_at < now() AND status IN ('Pending','In Progress','Escalated')"}) AS overdue_approvals
  `, clientId ? [clientId] : []);
  return rows[0];
}

export async function workflowHistory(workflowId) {
  const { rows } = await pool.query(
    "SELECT version, created_by AS changed_by, created_at AS date, snapshot, 'Saved' AS status FROM approval_workflow_versions WHERE workflow_id=$1 ORDER BY version DESC",
    [workflowId],
  );
  return rows;
}

async function notifyApprovers(payload, requestId, workflow, level) {
  const recipients = Array.isArray(payload.approverEmails)
    ? payload.approverEmails.filter(email => typeof email === "string" && email.includes("@"))
    : [];
  if (!recipients.length) return;
  await Promise.all(recipients.map(to => sendEmail({
    templateKey: "approval_request",
    to,
    variables: {
      user_name: level.approverRole || "approver",
      order_number: payload.reference || requestId,
      amount: payload.amount == null ? "" : `₹${Number(payload.amount).toLocaleString("en-IN")}`,
      portal_url: payload.portalUrl || "/configuration/workflows",
    },
    triggerModule: `approval:${workflow.module}`,
    sentBy: payload.requestedBy || "system",
    dedupeKey: `approval-request:${requestId}:${to}`,
  }).catch(error => console.warn("[approval] notification queued failed:", error.message))));
}