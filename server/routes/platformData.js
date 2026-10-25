import { Router } from "express";
import {
  getPlatformDataSnapshot,
  importPlatformDataBatch,
  PlatformDataError,
  savePlatformCart,
  savePlatformClients,
  savePlatformOrders,
} from "../services/platformDataStore.js";

const router = Router();

function actorFrom(req) {
  const actor = req.authenticatedUser;
  if (!actor?.id || !actor?.userType) {
    throw new PlatformDataError("A server-authenticated user is required.", 401);
  }
  return {
    id: String(actor.id),
    userType: String(actor.userType),
    clientId: String(actor.clientId || ""),
  };
}

const handle = (fn) => async (req, res) => {
  try {
    const actor = actorFrom(req);
    const result = await fn(req, actor);
    res.json({ success: true, data: result });
  } catch (error) {
    const status = error instanceof PlatformDataError
      ? error.statusCode
      : 500;
    if (status >= 500) console.error("[platform-data]", error);
    res.status(status).json({
      success: false,
      error: error.message || "Platform data request failed.",
    });
  }
};

router.get("/bootstrap", handle(async (_req, actor) =>
  getPlatformDataSnapshot(actor),
));

router.post("/import", handle(async (req, actor) =>
  importPlatformDataBatch(actor, req.body),
));

router.put("/orders", handle(async (req, actor) =>
  savePlatformOrders(actor, req.body),
));

router.put("/clients", handle(async (req, actor) =>
  savePlatformClients(actor, req.body),
));

router.put("/cart", handle(async (req, actor) =>
  savePlatformCart(actor, req.body?.items),
));

router.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "No platform data route matches this request.",
  });
});

export default router;
