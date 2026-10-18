import { Router } from "express";
import { pool } from "../db.js";
import { migrate } from "../migrate.js";
import {
  listWorkflows, getWorkflow, createWorkflow, updateWorkflow, changeWorkflowStatus,
  deleteWorkflow, duplicateWorkflow, listRequests, getRequest, takeAction,
  evaluateAndCreate, dashboard, workflowHistory,
} from "../services/approvalEngine.js";

const router = Router();
const MANAGEMENT_ROLES = new Set([
  "System Owner", "System Admin", "Procurement Manager",
  "Accounts Payable", "Finance", "Operations Manager",
]);
const VIEW_ROLES = new Set([...MANAGEMENT_ROLES, "Viewer"]);

function principal(req, res) {
  if (req.authenticatedUser?.id && req.authenticatedUser?.role) {
    return {
      id: String(req.authenticatedUser.id),
      name: String(req.authenticatedUser.name || req.authenticatedUser.email || "User"),
      role: String(req.authenticatedUser.role),
      userType: String(req.authenticatedUser.userType || "nido_admin"),
      clientId: String(req.authenticatedUser.clientId || ""),
      department: String(req.authenticatedUser.department || ""),
    };
  }

  // Browser-local identity headers are only a development bridge. Production
  // requests must be populated by server-side authentication middleware.
  if (process.env.NODE_ENV !== "production") {
    const id = req.get("x-nido-user-id");
    const role = req.get("x-nido-role");
    if (id && role) {
      return {
        id: String(id),
        name: String(req.get("x-nido-user-name") || "Development user"),
        role: String(role),
        userType: String(req.get("x-nido-user-type") || "nido_admin"),
        clientId: String(req.get("x-nido-client-id") || ""),
        department: String(req.get("x-nido-department") || ""),
      };
    }
  }

  res.status(401).json({
    success: false,
    error: "A server-authenticated user is required for approval workflows.",
  });
  return null;
}

function requireRole(req, res, roles, { allowClientPortal = false } = {}) {
  const actor = principal(req, res);
  if (!actor) return false;
  const isPortal = ["client_admin", "client_user"].includes(actor.userType);
  if (isPortal && (!allowClientPortal || !actor.clientId)) {
    res.status(403).json({ success: false, error: "You do not have permission to use approval workflows." });
    return false;
  }
  if (!isPortal && process.env.NODE_ENV === "production" && !roles.has(actor.role)) {
    res.status(403).json({ success: false, error: "You do not have permission to use approval workflows." });
    return false;
  }
  req.approvalActor = actor;
  return true;
}

function isClientPortalRequest(req) {
  return ["client_admin", "client_user"].includes(req.approvalActor?.userType);
}

const ah = fn => (req, res) => Promise.resolve(fn(req, res)).catch(error => {
  console.error("[approval routes]", error);
  res.status(error.message?.includes("cannot be deleted") || error.message?.includes("already complete") ? 409 : 400)
    .json({ success: false, error: error.message || "Approval request failed." });
});

router.use(async (_req, res, next) => {
  try {
    await migrate();
    if (!pool) throw new Error("The PostgreSQL database is not configured.");
    next();
  } catch (error) {
    res.status(503).json({ success: false, error: "Approval database is not reachable.", detail: error.message });
  }
});

router.get("/bootstrap", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES, { allowClientPortal: true })) return;
  const clientId = isClientPortalRequest(req) ? req.approvalActor.clientId : "";
  const [workflows, requests, stats] = await Promise.all([
    listWorkflows(clientId),
    listRequests(undefined, clientId),
    dashboard(clientId),
  ]);
  res.json({ success: true, data: { workflows, requests, stats } });
}));

router.get("/workflows", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES)) return;
  return res.json({ success: true, data: await listWorkflows() });
}));
router.get("/workflows/:id", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES)) return;
  const data = await getWorkflow(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: "Workflow not found." });
  return res.json({ success: true, data });
}));
router.post("/workflows", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  res.status(201).json({ success: true, data: await createWorkflow({
    ...(req.body || {}),
    createdBy: req.approvalActor.name,
    updatedBy: req.approvalActor.name,
  }) });
}));
router.put("/workflows/:id", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  const data = await updateWorkflow(req.params.id, { ...(req.body || {}), updatedBy: req.approvalActor.name });
  if (!data) return res.status(404).json({ success: false, error: "Workflow not found." });
  return res.json({ success: true, data });
}));
router.post("/workflows/:id/status", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  const data = await changeWorkflowStatus(req.params.id, req.body?.status, req.approvalActor.name);
  if (!data) return res.status(404).json({ success: false, error: "Workflow not found." });
  return res.json({ success: true, data });
}));
router.post("/workflows/:id/duplicate", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  res.status(201).json({ success: true, data: await duplicateWorkflow(req.params.id, req.approvalActor.name) });
}));
router.delete("/workflows/:id", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  const deleted = await deleteWorkflow(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: "Workflow not found." });
  return res.json({ success: true });
}));
router.get("/workflows/:id/history", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES)) return;
  res.json({ success: true, data: await workflowHistory(req.params.id) });
}));

router.get("/requests", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES, { allowClientPortal: true })) return;
  const clientId = isClientPortalRequest(req) ? req.approvalActor.clientId : "";
  res.json({ success: true, data: await listRequests(req.query.status, clientId) });
}));
router.get("/requests/:id", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES, { allowClientPortal: true })) return;
  const data = await getRequest(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: "Approval request not found." });
  if (isClientPortalRequest(req) && data.clientId !== req.approvalActor.clientId) {
    return res.status(404).json({ success: false, error: "Approval request not found." });
  }
  return res.json({ success: true, data });
}));
router.post("/requests/evaluate", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES, { allowClientPortal: true })) return;
  const actor = req.approvalActor;
  return res.json({ success: true, data: await evaluateAndCreate({
    ...(req.body || {}),
    requestedBy: actor.id,
    requestedByName: actor.name,
    requestedByRole: actor.role,
    userType: actor.userType,
    clientId: isClientPortalRequest(req) ? actor.clientId : (req.body?.clientId || undefined),
  }) });
}));
router.post("/requests/:id/action", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES, { allowClientPortal: true })) return;
  const existing = await getRequest(req.params.id);
  if (isClientPortalRequest(req) && (!existing || existing.clientId !== req.approvalActor.clientId)) {
    return res.status(404).json({ success: false, error: "Approval request not found." });
  }
  const actor = req.approvalActor;
  const data = await takeAction(req.params.id, {
    ...(req.body || {}),
    userId: actor.id,
    userName: actor.name,
    userRole: actor.role,
    userType: actor.userType,
    userDepartment: actor.department,
    clientId: actor.clientId,
  });
  if (!data) return res.status(404).json({ success: false, error: "Approval request not found." });
  return res.json({ success: true, data });
}));

export default router;