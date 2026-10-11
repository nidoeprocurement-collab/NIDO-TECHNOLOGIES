import { Router } from "express";
import { pool } from "../db.js";
import { migrate } from "../migrate.js";
import {
  assignOrderAutomatically,
  getAutoAssignmentConfig,
  listAssignmentHistory,
  listUnassignedQueue,
  manuallyAssignOrder,
  previewAutoAssignments,
  saveAutoAssignmentConfig,
  syncAutoAssignmentEmployees,
} from "../services/autoAssignmentService.js";

const router = Router();
const MANAGEMENT_ROLES = new Set([
  "System Owner",
  "System Admin",
  "Procurement Manager",
  "Operations Manager",
  "Team Lead",
]);
const VIEW_ROLES = new Set([...MANAGEMENT_ROLES, "Accounts Payable", "Finance", "Viewer"]);

function principal(req, res) {
  if (req.authenticatedUser?.id && req.authenticatedUser?.role) {
    return {
      id: String(req.authenticatedUser.id),
      name: String(req.authenticatedUser.name || req.authenticatedUser.email || "User"),
      role: String(req.authenticatedUser.role),
      userType: String(req.authenticatedUser.userType || "nido_admin"),
      clientId: String(req.authenticatedUser.clientId || ""),
    };
  }

  // The current app has browser-local authentication only. This compatibility
  // bridge is restricted to development and must not be accepted in production.
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
      };
    }
  }
  res.status(401).json({
    success: false,
    error: "A server-authenticated user is required for order assignment.",
  });
  return null;
}

function requireView(req, res, allowPortal = false) {
  const actor = principal(req, res);
  if (!actor) return null;
  if (allowPortal && ["client_admin", "client_user"].includes(actor.userType)) return actor;
  // The development app supports user-defined roles in browser storage, which
  // the server cannot independently resolve. Production still requires a
  // verified server principal and an explicitly allowed role.
  if (process.env.NODE_ENV === "production" && !VIEW_ROLES.has(actor.role)) {
    res.status(403).json({ success: false, error: "You do not have permission to view order assignment." });
    return null;
  }
  return actor;
}

function requireManage(req, res) {
  const actor = principal(req, res);
  if (!actor) return null;
  if (process.env.NODE_ENV === "production" && !MANAGEMENT_ROLES.has(actor.role)) {
    res.status(403).json({ success: false, error: "Only authorized administrators and team leads can manage order assignment." });
    return null;
  }
  return actor;
}

const handle = (fn) => async (req, res) => {
  try {
    await migrate();
    if (!pool) {
      return res.status(503).json({ success: false, error: "The assignment database is not configured." });
    }
    await fn(req, res);
  } catch (error) {
    console.error("[auto-assignment]", error);
    const status = error.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, error: error.message || "Order assignment request failed." });
  }
};

router.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

router.get("/settings", handle(async (req, res) => {
  if (!requireView(req, res)) return;
  res.json({ success: true, data: await getAutoAssignmentConfig() });
}));

router.put("/settings", handle(async (req, res) => {
  const actor = requireManage(req, res);
  if (!actor) return;
  res.json({ success: true, data: await saveAutoAssignmentConfig(req.body, actor) });
}));

router.put("/employees", handle(async (req, res) => {
  if (!requireManage(req, res)) return;
  await syncAutoAssignmentEmployees(req.body?.employees);
  res.json({ success: true });
}));

router.get("/preview", handle(async (req, res) => {
  if (!requireView(req, res)) return;
  res.json({ success: true, data: await previewAutoAssignments() });
}));

router.get("/history", handle(async (req, res) => {
  if (!requireView(req, res)) return;
  const [history, unassigned] = await Promise.all([
    listAssignmentHistory({
      tier: req.query.tier,
      employeeId: req.query.employeeId,
      method: req.query.method,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    }),
    listUnassignedQueue(),
  ]);
  res.json({ success: true, data: { history, unassigned } });
}));

router.post("/orders/assign", handle(async (req, res) => {
  const actor = principal(req, res);
  if (!actor) return;
  if (actor.clientId && String(req.body?.clientId || "") !== actor.clientId) {
    return res.status(403).json({ success: false, error: "You cannot assign an order for another client." });
  }
  const input = { ...(req.body || {}) };
  if (process.env.NODE_ENV === "production") delete input.employees;
  const data = await assignOrderAutomatically(input, actor);
  res.json({ success: true, data });
}));

router.put("/orders/:assignmentId/assignment", handle(async (req, res) => {
  const actor = requireManage(req, res);
  if (!actor) return;
  const data = await manuallyAssignOrder(
    req.params.assignmentId,
    req.body?.employeeId,
    req.body?.reason,
    actor,
  );
  res.json({ success: true, data });
}));

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `No Auto Assignment API route matches ${req.method} ${req.path}.`,
  });
});

export default router;
