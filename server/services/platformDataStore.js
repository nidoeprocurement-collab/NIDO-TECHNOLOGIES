import { pool } from "../db.js";

const MAX_RECORDS_PER_BATCH = 500;
const MAX_CART_ITEMS = 500;
const MAX_RECORD_BYTES = 4 * 1024 * 1024;

export class PlatformDataError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PlatformDataError";
    this.statusCode = statusCode;
  }
}

function requireDatabase() {
  if (!pool) {
    throw new PlatformDataError("The PostgreSQL database is unavailable.", 503);
  }
}

function isNidoAdmin(actor) {
  return actor?.userType === "nido_admin";
}

function requireNidoAdmin(actor) {
  if (!isNidoAdmin(actor)) {
    throw new PlatformDataError("Only NIDO administrators can manage clients.", 403);
  }
}

function validateList(value, label, maximum = MAX_RECORDS_PER_BATCH) {
  if (!Array.isArray(value)) {
    throw new PlatformDataError(`${label} must be a list.`);
  }
  if (value.length > maximum) {
    throw new PlatformDataError(`${label} exceeds the maximum batch size.`);
  }
  return value;
}

function normalizeRecord(value, idField) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = String(value[idField] || "").trim();
  if (!id || id.length > 200) return null;
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > MAX_RECORD_BYTES) {
    throw new PlatformDataError(`Record ${id} is too large to save.`);
  }
  return { id, payload: value };
}

function safeTimestamp(value) {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function orderCreatedAt(order) {
  return safeTimestamp(order.createdAt) || safeTimestamp(order.orderDate);
}

function cartLineKey(item) {
  const configuration = item.configuration && typeof item.configuration === "object"
    ? Object.entries(item.configuration)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value}`)
        .join("&")
    : "";
  return [
    item.productCode || item.id || "",
    item.selectedVendorId || "",
    configuration,
  ].join("__");
}

export function mergeCartItems(existingItems, incomingItems) {
  const merged = new Map();
  for (const item of [...existingItems, ...incomingItems]) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const key = cartLineKey(item);
    if (!key || key === "____") continue;
    const quantity = Math.max(0, Number(item.quantity) || 0);
    if (quantity <= 0) continue;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...item, quantity });
      continue;
    }
    const nextQuantity = existing.quantity + quantity;
    merged.set(key, {
      ...existing,
      ...item,
      quantity: nextQuantity,
      vendorAllocations: item.selectedVendorId
        ? [{
            vendorId: item.selectedVendorId,
            vendorProductId: "",
            vendorName: item.selectedVendorName || "",
            allocated: nextQuantity,
          }]
        : (item.vendorAllocations || existing.vendorAllocations || []),
    });
  }
  return [...merged.values()];
}

function normalizeOrderRecords(values, actor, { importOnly = false } = {}) {
  const records = validateList(values || [], "Orders");
  const normalized = [];
  for (const value of records) {
    const record = normalizeRecord(value, "id");
    if (!record) continue;
    const clientId = String(record.payload.clientId || "").trim() || null;
    if (!isNidoAdmin(actor) && clientId !== actor.clientId) {
      if (importOnly) continue;
      throw new PlatformDataError("You cannot access an order for another client.", 403);
    }
    normalized.push({
      id: record.id,
      clientId,
      payload: record.payload,
      createdAt: orderCreatedAt(record.payload),
    });
  }
  return normalized;
}

function normalizeClientRecords(values, isArchived) {
  const records = validateList(values || [], isArchived ? "Archived clients" : "Clients");
  return records.flatMap((value) => {
    const record = normalizeRecord(value, "id");
    return record
      ? [{ id: record.id, isArchived, payload: record.payload }]
      : [];
  });
}

export async function getPlatformDataSnapshot(actor) {
  requireDatabase();
  if (isNidoAdmin(actor)) {
    const [clients, archivedClients, orders, cart] = await Promise.all([
      pool.query(
        `SELECT payload FROM nido_platform_clients
         WHERE is_archived = false ORDER BY client_id`,
      ),
      pool.query(
        `SELECT payload FROM nido_platform_clients
         WHERE is_archived = true ORDER BY client_id`,
      ),
      pool.query(
        `SELECT payload FROM nido_platform_orders
         WHERE is_deleted = false ORDER BY created_at DESC, order_id DESC`,
      ),
      pool.query(
        `SELECT items FROM nido_platform_carts WHERE user_id = $1`,
        [actor.id],
      ),
    ]);
    return {
      clients: clients.rows.map((row) => row.payload),
      archivedClients: archivedClients.rows.map((row) => row.payload),
      orders: orders.rows.map((row) => row.payload),
      cart: cart.rows[0]?.items || [],
    };
  }

  const [clients, archivedClients, orders, cart] = await Promise.all([
    pool.query(
      `SELECT payload FROM nido_platform_clients
       WHERE client_id = $1 AND is_archived = false`,
      [actor.clientId],
    ),
    pool.query(
      `SELECT payload FROM nido_platform_clients
       WHERE client_id = $1 AND is_archived = true`,
      [actor.clientId],
    ),
    pool.query(
      `SELECT payload FROM nido_platform_orders
       WHERE client_id = $1 AND is_deleted = false
       ORDER BY created_at DESC, order_id DESC`,
      [actor.clientId],
    ),
    pool.query(
      `SELECT items FROM nido_platform_carts WHERE user_id = $1`,
      [actor.id],
    ),
  ]);
  return {
    clients: clients.rows.map((row) => row.payload),
    archivedClients: archivedClients.rows.map((row) => row.payload),
    orders: orders.rows.map((row) => row.payload),
    cart: cart.rows[0]?.items || [],
  };
}

export async function importPlatformDataBatch(actor, input) {
  requireDatabase();
  const dataset = String(input?.dataset || "");
  const sourceId = String(input?.sourceId || "").trim();
  const batchId = String(input?.batchId || "").trim();
  if (!["orders", "clients", "cart"].includes(dataset)) {
    throw new PlatformDataError("Unsupported data set.");
  }
  if (!sourceId || sourceId.length > 160 || !batchId || batchId.length > 120) {
    throw new PlatformDataError("A valid import source and batch ID are required.");
  }
  if (dataset === "clients") requireNidoAdmin(actor);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const claimed = await client.query(
      `INSERT INTO nido_platform_data_imports (user_id, source_id, dataset, batch_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, source_id, dataset, batch_id) DO NOTHING
       RETURNING dataset`,
      [actor.id, sourceId, dataset, batchId],
    );
    if (claimed.rowCount === 0) {
      await client.query("COMMIT");
      return { imported: false, alreadyImported: true };
    }

    let inserted = 0;
    if (dataset === "orders") {
      const records = normalizeOrderRecords(input.records || [], actor, { importOnly: true });
      for (const order of records) {
        const result = await client.query(
          `INSERT INTO nido_platform_orders
            (order_id, client_id, payload, created_at, updated_by)
           VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), $5)
           ON CONFLICT (order_id) DO NOTHING`,
          [
            order.id,
            order.clientId,
            JSON.stringify(order.payload),
            order.createdAt,
            actor.id,
          ],
        );
        inserted += result.rowCount;
      }
    } else if (dataset === "clients") {
      const clients = [
        ...normalizeClientRecords(input.clients || [], false),
        ...normalizeClientRecords(input.archivedClients || [], true),
      ];
      for (const record of clients) {
        const result = await client.query(
          `INSERT INTO nido_platform_clients
            (client_id, is_archived, payload, updated_by)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (client_id) DO NOTHING`,
          [
            record.id,
            record.isArchived,
            JSON.stringify(record.payload),
            actor.id,
          ],
        );
        inserted += result.rowCount;
      }
    } else {
      const items = validateList(input.items || [], "Cart items", MAX_CART_ITEMS);
      const current = await client.query(
        `SELECT items FROM nido_platform_carts WHERE user_id = $1 FOR UPDATE`,
        [actor.id],
      );
      const combined = mergeCartItems(current.rows[0]?.items || [], items);
      await client.query(
        `INSERT INTO nido_platform_carts (user_id, items, updated_by)
         VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET items = EXCLUDED.items, updated_by = EXCLUDED.updated_by,
               updated_at = now()`,
        [actor.id, JSON.stringify(combined), actor.id],
      );
      inserted = items.length;
    }

    await client.query("COMMIT");
    return { imported: true, inserted };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function savePlatformOrders(actor, input) {
  requireDatabase();
  const orders = normalizeOrderRecords(input?.upserts || [], actor);
  const deletedIds = [...new Set(
    validateList(input?.deletedIds || [], "Deleted order IDs")
      .map((id) => String(id || "").trim())
      .filter((id) => id && id.length <= 200),
  )];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const order of orders) {
      const result = await client.query(
        `INSERT INTO nido_platform_orders
          (order_id, client_id, payload, created_at, updated_by)
         VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), $5)
         ON CONFLICT (order_id) DO UPDATE
           SET client_id = EXCLUDED.client_id, payload = EXCLUDED.payload,
               updated_by = EXCLUDED.updated_by, updated_at = now(),
               is_deleted = false
         WHERE $6::boolean
            OR nido_platform_orders.client_id IS NOT DISTINCT FROM EXCLUDED.client_id`,
        [
          order.id,
          order.clientId,
          JSON.stringify(order.payload),
          order.createdAt,
          actor.id,
          isNidoAdmin(actor),
        ],
      );
      if (result.rowCount === 0 && !isNidoAdmin(actor)) {
        throw new PlatformDataError("You cannot update an order for another client.", 403);
      }
    }
    for (const id of deletedIds) {
      await client.query(
        `UPDATE nido_platform_orders SET is_deleted = true,
           updated_by = $2, updated_at = now()
         WHERE order_id = $1 AND ($3::boolean OR client_id = $4)`,
        [id, actor.id, isNidoAdmin(actor), actor.clientId || null],
      );
    }
    await client.query("COMMIT");
    return { saved: orders.length, archived: deletedIds.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function savePlatformClients(actor, input) {
  requireDatabase();
  requireNidoAdmin(actor);
  const active = normalizeClientRecords(input?.clients || [], false);
  const archived = normalizeClientRecords(input?.archivedClients || [], true);
  const archiveIds = [...new Set(
    validateList(input?.archiveIds || [], "Archived client IDs")
      .map((id) => String(id || "").trim())
      .filter((id) => id && id.length <= 200),
  )];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const record of [...active, ...archived]) {
      await client.query(
        `INSERT INTO nido_platform_clients
          (client_id, is_archived, payload, updated_by)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT (client_id) DO UPDATE
           SET is_archived = EXCLUDED.is_archived, payload = EXCLUDED.payload,
               updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [
          record.id,
          record.isArchived,
          JSON.stringify(record.payload),
          actor.id,
        ],
      );
    }
    if (archiveIds.length) {
      await client.query(
        `UPDATE nido_platform_clients
         SET is_archived = true, updated_by = $2, updated_at = now()
         WHERE client_id = ANY($1::text[])`,
        [archiveIds, actor.id],
      );
    }
    await client.query("COMMIT");
    return { saved: active.length + archived.length, archived: archiveIds.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function savePlatformCart(actor, items) {
  requireDatabase();
  const safeItems = validateList(items, "Cart items", MAX_CART_ITEMS);
  if (safeItems.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new PlatformDataError("Cart items must be valid objects.");
  }
  await pool.query(
    `INSERT INTO nido_platform_carts (user_id, items, updated_by)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET items = EXCLUDED.items, updated_by = EXCLUDED.updated_by,
           updated_at = now()`,
    [actor.id, JSON.stringify(safeItems), actor.id],
  );
  return { saved: safeItems.length };
}
