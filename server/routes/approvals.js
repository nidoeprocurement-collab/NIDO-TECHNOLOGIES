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

function requestRole(req) {
  return String(req.get("x-nido-role") || req.body?.actorRole || req.body?.updatedByRole || req.body?.userRole || "");
}

function portalClientId(req) {
  return String(req.get("x-nido-client-id") || req.body?.clientId || "");
}

function isClientPortalRequest(req) {
  return ["client_admin", "client_user"].includes(String(req.get("x-nido-user-type") || req.body?.userType || ""))
    && Boolean(portalClientId(req));
}

function requireRole(req, res, roles, { allowClientPortal = false, allowAnyRole = false } = {}) {
  const role = requestRole(req);
  if (!roles.has(role) && !(allowClientPortal && isClientPortalRequest(req)) && !(allowAnyRole && role)) {
    res.status(403).json({ success: false, error: "You do not have permission to use approval workflows." });
    return false;
  }
  return true;
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
  if (!requireRole(req, res, VIEW_ROLES, { allowClientPortal: true, allowAnyRole: true })) return;
  const clientId = isClientPortalRequest(req) ? portalClientId(req) : "";
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
  res.status(201).json({ success: true, data: await createWorkflow(req.body || {}) });
}));
router.put("/workflows/:id", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  const data = await updateWorkflow(req.params.id, req.body || {});
  if (!data) return res.status(404).json({ success: false, error: "Workflow not found." });
  return res.json({ success: true, data });
}));
router.post("/workflows/:id/status", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  const data = await changeWorkflowStatus(req.params.id, req.body?.status, req.body?.updatedBy);
  if (!data) return res.status(404).json({ success: false, error: "Workflow not found." });
  return res.json({ success: true, data });
}));
router.post("/workflows/:id/duplicate", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES)) return;
  res.status(201).json({ success: true, data: await duplicateWorkflow(req.params.id, req.body?.createdBy) });
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
  if (!requireRole(req, res, VIEW_ROLES, { allowClientPortal: true, allowAnyRole: true })) return;
  const clientId = isClientPortalRequest(req) ? portalClientId(req) : "";
  res.json({ success: true, data: await listRequests(req.query.status, clientId) });
}));
router.get("/requests/:id", ah(async (req, res) => {
  if (!requireRole(req, res, VIEW_ROLES, { allowClientPortal: true, allowAnyRole: true })) return;
  const data = await getRequest(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: "Approval request not found." });
  if (isClientPortalRequest(req) && data.clientId !== portalClientId(req)) {
    return res.status(404).json({ success: false, error: "Approval request not found." });
  }
  return res.json({ success: true, data });
}));
router.post("/requests/evaluate", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES, { allowClientPortal: true, allowAnyRole: true })) return;
  return res.json({ success: true, data: await evaluateAndCreate(req.body || {}) });
}));
router.post("/requests/:id/action", ah(async (req, res) => {
  if (!requireRole(req, res, MANAGEMENT_ROLES, { allowClientPortal: true, allowAnyRole: true })) return;
  const existing = await getRequest(req.params.id);
  if (isClientPortalRequest(req) && (!existing || existing.clientId !== portalClientId(req))) {
    return res.status(404).json({ success: false, error: "Approval request not found." });
  }
  const data = await takeAction(req.params.id, req.body || {});
  if (!data) return res.status(404).json({ success: false, error: "Approval request not found." });
  return res.json({ success: true, data });
}));

export default router;