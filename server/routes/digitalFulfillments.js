import { Router } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";
import { migrate } from "../migrate.js";
import { encryptSecret } from "../lib/crypto.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageRoot = path.resolve(__dirname, "../storage/digital-fulfillments");

const VIEW_ROLES = new Set([
  "System Owner", "System Admin", "Procurement Manager",
  "Accounts Payable", "Finance", "Operations Manager", "Viewer",
]);
const ACTION_ROLES = new Set([
  "System Owner", "System Admin", "Procurement Manager",
  "Accounts Payable", "Finance", "Operations Manager",
]);
const CLIENT_DOWNLOAD_STATUSES = new Set(["RELEASED", "DOWNLOADED", "COMPLETED"]);
const LICENSE_STATUSES = new Set(["PENDING", "LICENSE_UPLOADED", "PENDING_RELEASE"]);
const MAX_LICENSE_BYTES = 50 * 1024 * 1024;

const ah = fn => (req, res) => Promise.resolve(fn(req, res)).catch(error => {
  console.error("[digital fulfillment routes]", error.message);
  res.status(error.statusCode || 400).json({
    success: false,
    error: error.publicMessage || error.message || "Digital fulfillment request failed.",
  });
});

function normalizeActor(principal) {
  if (!principal?.id) return null;
  return {
    id: String(principal.id),
    name: String(principal.name || principal.email || principal.id),
    role: String(principal.role || ""),
    clientId: String(principal.clientId || principal.client_id || ""),
    userType: String(principal.userType || principal.user_type || ""),
  };
}

/**
 * The imported frontend currently authenticates against localStorage, which
 * cannot produce a trustworthy server identity. Production must therefore
 * receive a principal from real server middleware (req.authenticatedUser,
 * req.auth, or req.user). The header bridge is deliberately limited to local
 * development and can be disabled with NIDO_ALLOW_LOCAL_AUTH_HEADERS=false.
 */
function actorFromRequest(req) {
  const serverPrincipal = req.authenticatedUser || req.auth?.user || req.auth || req.user;
  const trustedActor = normalizeActor(serverPrincipal);
  if (trustedActor) return trustedActor;

  if (process.env.NODE_ENV !== "production" && process.env.NIDO_ALLOW_LOCAL_AUTH_HEADERS !== "false") {
    return normalizeActor({
      id: req.get("x-nido-user-id"),
      name: req.get("x-nido-user-name"),
      role: req.get("x-nido-role"),
      clientId: req.get("x-nido-client-id"),
      userType: req.get("x-nido-user-type"),
    });
  }

  return null;
}

function requireInternalRole(req, res, roles) {
  const actor = actorFromRequest(req);
  if (!actor) {
    res.status(401).json({ success: false, error: "A server-authenticated user context is required." });
    return false;
  }
  if (!roles.has(actor.role)) {
    res.status(403).json({ success: false, error: "You do not have permission to manage digital fulfillments." });
    return false;
  }
  return true;
}

function requireAuthenticatedClient(req, res) {
  const actor = actorFromRequest(req);
  if (!actor || !actor.clientId) {
    res.status(401).json({ success: false, error: "A server-authenticated client context is required." });
    return null;
  }
  return actor;
}

function isDigitalItem(item) {
  const fulfillmentType = String(item?.fulfillmentType || "").toLowerCase();
  const physicalType = String(item?.physicalType || "").toLowerCase();
  const productType = String(item?.productType || "").toLowerCase();
  return fulfillmentType === "digital"
    || physicalType.includes("digital")
    || physicalType.includes("service")
    || productType.includes("digital")
    || productType.includes("service");
}

function safeFileName(name) {
  const base = path.basename(String(name || "license.bin")).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 180) || "license.bin";
}

function toPublicFulfillment(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    productId: row.product_id,
    clientId: row.client_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    status: row.status,
    licenseOriginalName: row.license_original_name,
    licenseMimeType: row.license_mime_type,
    licenseSize: row.license_size == null ? null : Number(row.license_size),
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    releasedBy: row.released_by,
    releasedAt: row.released_at,
    downloadedAt: row.downloaded_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getFulfillment(id) {
  const result = await pool.query("SELECT * FROM digital_fulfillments WHERE id = $1", [id]);
  return result.rows[0] || null;
}

function decodeLicenseFile(fileBase64) {
  const encoded = String(fileBase64 || "")
    .replace(/^data:[^;]+;base64,/, "")
    .replace(/\s/g, "");
  if (!encoded || encoded.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    const error = new Error("License file encoding is invalid.");
    error.statusCode = 400;
    throw error;
  }

  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const estimatedBytes = (encoded.length * 3) / 4 - padding;
  if (estimatedBytes > MAX_LICENSE_BYTES) {
    const error = new Error("License file must be between 1 byte and 50 MB.");
    error.statusCode = 400;
    throw error;
  }

  const contents = Buffer.from(encoded, "base64");
  if (!contents.length || contents.length > MAX_LICENSE_BYTES) {
    const error = new Error("License file must be between 1 byte and 50 MB.");
    error.statusCode = 400;
    throw error;
  }
  return contents;
}

async function audit(client, fulfillmentId, event, actor, metadata = {}) {
  await client.query(
    `INSERT INTO digital_fulfillment_audit_log
      (fulfillment_id, event, actor_id, actor_name, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [fulfillmentId, event, actor.id, actor.name, JSON.stringify(metadata)],
  );
}

function assertStatusTransition(current, next) {
  const transitions = {
    PENDING: new Set(["LICENSE_UPLOADED", "PENDING_RELEASE", "CANCELLED"]),
    LICENSE_UPLOADED: new Set(["PENDING_RELEASE", "RELEASED", "CANCELLED"]),
    PENDING_RELEASE: new Set(["RELEASED", "CANCELLED"]),
    RELEASED: new Set(["CANCELLED"]),
    DOWNLOADED: new Set(["COMPLETED", "CANCELLED"]),
    COMPLETED: new Set(),
    CANCELLED: new Set(),
  };
  if (current === next || transitions[current]?.has(next)) return;
  const error = new Error(`Invalid digital fulfillment status transition: ${current} to ${next}.`);
  error.statusCode = 409;
  throw error;
}

router.use(async (_req, res, next) => {
  try {
    await migrate();
    if (!pool) throw new Error("The PostgreSQL database is not configured.");
    next();
  } catch (error) {
    res.status(503).json({ success: false, error: "Digital fulfillment database is not reachable." });
  }
});

// Called by the existing order creation flow. It is idempotent so retries
// cannot create duplicate fulfillment records for the same digital item.
router.post("/digital-fulfillments/order", ah(async (req, res) => {
  const actor = actorFromRequest(req);
  if (!actor) {
    return res.status(401).json({ success: false, error: "A server-authenticated user context is required." });
  }

  const { orderId, clientId, cartItems } = req.body || {};
  if (!orderId || !clientId || !Array.isArray(cartItems)) {
    return res.status(400).json({ success: false, error: "orderId, clientId, and cartItems are required." });
  }
  if (actor.userType !== "nido_admin" && (!actor.clientId || actor.clientId !== String(clientId))) {
    return res.status(403).json({ success: false, error: "You cannot create fulfillment records for another client." });
  }

  const digitalItems = cartItems.filter(isDigitalItem);
  if (digitalItems.length === 0) {
    return res.status(201).json({ success: true, data: [], createdCount: 0 });
  }

  const client = await pool.connect();
  const created = [];
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO digital_fulfillment_orders (order_id, client_id)
       VALUES ($1, $2)
       ON CONFLICT (order_id) DO NOTHING`,
      [String(orderId), String(clientId)],
    );
    const ownerResult = await client.query(
      "SELECT client_id FROM digital_fulfillment_orders WHERE order_id = $1 FOR UPDATE",
      [String(orderId)],
    );
    if (!ownerResult.rows[0] || ownerResult.rows[0].client_id !== String(clientId)) {
      const error = new Error("This order already belongs to another client.");
      error.statusCode = 409;
      throw error;
    }

    for (const item of digitalItems) {
      const orderItemId = `${orderId}-${String(item.id)}`;
      const result = await client.query(
        `INSERT INTO digital_fulfillments
          (id, order_id, order_item_id, product_id, client_id, supplier_id, supplier_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
         ON CONFLICT (order_id, order_item_id) DO NOTHING
         RETURNING *`,
        [
          `DF-${crypto.randomUUID()}`,
          String(orderId),
          orderItemId,
          String(item.productCode || item.id),
          String(clientId),
          item.selectedVendorId ? String(item.selectedVendorId) : null,
          item.selectedVendorName ? String(item.selectedVendorName) : null,
        ],
      );
      if (result.rows[0]) {
        await audit(client, result.rows[0].id, "fulfillment_created", actor, {
          orderId: String(orderId),
          orderItemId,
        });
        created.push(toPublicFulfillment(result.rows[0]));
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const existing = await pool.query(
    "SELECT * FROM digital_fulfillments WHERE order_id = $1 ORDER BY created_at",
    [String(orderId)],
  );
  return res.status(201).json({
    success: true,
    data: existing.rows.map(toPublicFulfillment),
    createdCount: created.length,
  });
}));

router.get("/internal/orders/:orderId/digital-fulfillments", ah(async (req, res) => {
  if (!requireInternalRole(req, res, VIEW_ROLES)) return;
  const result = await pool.query(
    "SELECT * FROM digital_fulfillments WHERE order_id = $1 ORDER BY created_at",
    [req.params.orderId],
  );
  return res.json({ success: true, data: result.rows.map(toPublicFulfillment) });
}));

router.post("/internal/digital-fulfillments/:id/license", ah(async (req, res) => {
  if (!requireInternalRole(req, res, ACTION_ROLES)) return;
  const actor = actorFromRequest(req);
  const fulfillment = await getFulfillment(req.params.id);
  if (!fulfillment) return res.status(404).json({ success: false, error: "Digital fulfillment not found." });
  if (!LICENSE_STATUSES.has(fulfillment.status)) {
    return res.status(409).json({ success: false, error: "A license cannot be uploaded in the current status." });
  }

  const { originalFileName, mimeType, fileBase64, password, status } = req.body || {};
  if (!originalFileName || !fileBase64 || typeof password !== "string" || !password) {
    return res.status(400).json({ success: false, error: "originalFileName, fileBase64, and password are required." });
  }
  const requestedStatus = status || "LICENSE_UPLOADED";
  if (!new Set(["LICENSE_UPLOADED", "PENDING_RELEASE"]).has(requestedStatus)) {
    return res.status(400).json({ success: false, error: "License upload status is invalid." });
  }
  assertStatusTransition(fulfillment.status, requestedStatus);

  const contents = decodeLicenseFile(fileBase64);

  await fs.mkdir(storageRoot, { recursive: true });
  const storageKey = `${fulfillment.id}/${crypto.randomUUID()}-${safeFileName(originalFileName)}`;
  const absolutePath = path.resolve(storageRoot, storageKey);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents, { flag: "wx", mode: 0o600 });

  let encryptedPassword;
  try {
    encryptedPassword = encryptSecret(password);
  } catch (error) {
    await fs.rm(absolutePath, { force: true });
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const replaced = Boolean(fulfillment.license_storage_key);
    const result = await client.query(
      `UPDATE digital_fulfillments
       SET status = $1, license_original_name = $2, license_storage_key = $3,
           license_mime_type = $4, license_size = $5, encrypted_password = $6,
           uploaded_by = $7, uploaded_at = now(), updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [requestedStatus, safeFileName(originalFileName), storageKey, String(mimeType || "application/octet-stream"),
        contents.length, encryptedPassword, actor.id, fulfillment.id],
    );
    await audit(client, fulfillment.id, replaced ? "license_replaced" : "license_uploaded", actor, {
      fileName: safeFileName(originalFileName),
      size: contents.length,
    });
    await audit(client, fulfillment.id, "password_updated", actor);
    await client.query("COMMIT");

    if (fulfillment.license_storage_key) {
      const oldPath = path.resolve(storageRoot, fulfillment.license_storage_key);
      if (oldPath.startsWith(`${storageRoot}${path.sep}`)) await fs.rm(oldPath, { force: true });
    }
    return res.json({ success: true, data: toPublicFulfillment(result.rows[0]) });
  } catch (error) {
    await client.query("ROLLBACK");
    await fs.rm(absolutePath, { force: true });
    throw error;
  } finally {
    client.release();
  }
}));

router.post("/internal/digital-fulfillments/:id/release", ah(async (req, res) => {
  if (!requireInternalRole(req, res, ACTION_ROLES)) return;
  const actor = actorFromRequest(req);
  const fulfillment = await getFulfillment(req.params.id);
  if (!fulfillment) return res.status(404).json({ success: false, error: "Digital fulfillment not found." });
  assertStatusTransition(fulfillment.status, "RELEASED");
  if (!fulfillment.license_storage_key || !fulfillment.encrypted_password) {
    return res.status(409).json({ success: false, error: "A stored license and password are required before release." });
  }

  const result = await pool.query(
    `UPDATE digital_fulfillments
     SET status = 'RELEASED', released_by = $1, released_at = now(), updated_at = now()
     WHERE id = $2 RETURNING *`,
    [actor.id, fulfillment.id],
  );
  await pool.query(
    `INSERT INTO digital_fulfillment_audit_log (fulfillment_id, event, actor_id, actor_name)
     VALUES ($1, 'license_released', $2, $3)`,
    [fulfillment.id, actor.id, actor.name],
  );
  return res.json({ success: true, data: toPublicFulfillment(result.rows[0]) });
}));

router.post("/internal/digital-fulfillments/:id/cancel", ah(async (req, res) => {
  if (!requireInternalRole(req, res, ACTION_ROLES)) return;
  const actor = actorFromRequest(req);
  const fulfillment = await getFulfillment(req.params.id);
  if (!fulfillment) return res.status(404).json({ success: false, error: "Digital fulfillment not found." });
  assertStatusTransition(fulfillment.status, "CANCELLED");
  const result = await pool.query(
    `UPDATE digital_fulfillments
     SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
     WHERE id = $1 RETURNING *`,
    [fulfillment.id],
  );
  await pool.query(
    `INSERT INTO digital_fulfillment_audit_log (fulfillment_id, event, actor_id, actor_name)
     VALUES ($1, 'fulfillment_cancelled', $2, $3)`,
    [fulfillment.id, actor.id, actor.name],
  );
  return res.json({ success: true, data: toPublicFulfillment(result.rows[0]) });
}));

router.post("/internal/digital-fulfillments/:id/complete", ah(async (req, res) => {
  if (!requireInternalRole(req, res, ACTION_ROLES)) return;
  const actor = actorFromRequest(req);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      "SELECT * FROM digital_fulfillments WHERE id = $1 FOR UPDATE",
      [req.params.id],
    );
    const fulfillment = locked.rows[0];
    if (!fulfillment) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Digital fulfillment not found." });
    }

    assertStatusTransition(fulfillment.status, "COMPLETED");
    const alreadyCompleted = fulfillment.status === "COMPLETED";
    const result = await client.query(
      `UPDATE digital_fulfillments
       SET status = 'COMPLETED',
           completed_at = COALESCE(completed_at, now()),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [fulfillment.id],
    );
    if (!alreadyCompleted) {
      await audit(client, fulfillment.id, "fulfillment_completed", actor);
    }
    await client.query("COMMIT");
    return res.json({ success: true, data: toPublicFulfillment(result.rows[0]) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

router.get("/client/digital-fulfillments/:id/download", ah(async (req, res) => {
  const actor = requireAuthenticatedClient(req, res);
  if (!actor) return;
  const result = await pool.query(
    `SELECT f.*, o.client_id AS order_owner_client_id
     FROM digital_fulfillments f
     INNER JOIN digital_fulfillment_orders o ON o.order_id = f.order_id
     WHERE f.id = $1`,
    [req.params.id],
  );
  const fulfillment = result.rows[0];
  if (!fulfillment) return res.status(404).json({ success: false, error: "Digital fulfillment not found." });
  if (fulfillment.client_id !== fulfillment.order_owner_client_id
      || fulfillment.order_owner_client_id !== actor.clientId) {
    return res.status(403).json({ success: false, error: "You cannot access another client's fulfillment." });
  }
  if (!CLIENT_DOWNLOAD_STATUSES.has(fulfillment.status)) {
    return res.status(403).json({ success: false, error: "This digital license has not been released." });
  }
  if (!fulfillment.license_storage_key) {
    return res.status(404).json({ success: false, error: "The released license file is unavailable." });
  }

  const absolutePath = path.resolve(storageRoot, fulfillment.license_storage_key);
  if (!absolutePath.startsWith(`${storageRoot}${path.sep}`)) {
    return res.status(400).json({ success: false, error: "Invalid license storage reference." });
  }
  try {
    await fs.access(absolutePath);
  } catch {
    return res.status(404).json({ success: false, error: "The released license file is unavailable." });
  }

  if (!fulfillment.downloaded_at) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `UPDATE digital_fulfillments
         SET status = CASE WHEN status = 'RELEASED' THEN 'DOWNLOADED' ELSE status END,
             downloaded_at = now(), updated_at = now()
         WHERE id = $1 RETURNING *`,
        [fulfillment.id],
      );
      await audit(client, fulfillment.id, "license_downloaded", actor);
      await client.query("COMMIT");
      fulfillment.status = result.rows[0].status;
      fulfillment.downloaded_at = result.rows[0].downloaded_at;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  res.type(fulfillment.license_mime_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFileName(fulfillment.license_original_name)}"`);
  return res.sendFile(absolutePath);
}));

export default router;