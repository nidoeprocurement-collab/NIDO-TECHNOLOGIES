import { Router } from "express";
import { pool } from "../db.js";

const router = Router();
const GENERAL_SETTINGS_KEY = "general";
const MAX_SETTINGS_BYTES = 1_000_000;

function requireInternalUser(req, res) {
  if (req.authenticatedUser?.userType !== "nido_admin") {
    res.status(403).json({ error: "internal_user_required" });
    return false;
  }
  return true;
}

router.get("/general", async (req, res) => {
  if (!requireInternalUser(req, res)) return;
  if (!pool) {
    return res.status(503).json({ error: "database_unavailable" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT setting_value, updated_at FROM platform_settings WHERE setting_key = $1",
      [GENERAL_SETTINGS_KEY],
    );
    return res.json({
      settings: rows[0]?.setting_value ?? null,
      updatedAt: rows[0]?.updated_at ?? null,
    });
  } catch (error) {
    console.error("[platform-settings] failed to load general settings:", error);
    return res.status(503).json({ error: "settings_unavailable" });
  }
});

router.put("/general", async (req, res) => {
  if (!requireInternalUser(req, res)) return;
  if (req.authenticatedUser?.role !== "System Owner") {
    return res.status(403).json({ error: "system_owner_required" });
  }
  if (!pool) {
    return res.status(503).json({ error: "database_unavailable" });
  }

  const settings = req.body?.settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return res.status(400).json({ error: "invalid_settings" });
  }
  const serialized = JSON.stringify(settings);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SETTINGS_BYTES) {
    return res.status(413).json({ error: "settings_too_large" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO platform_settings (setting_key, setting_value, updated_by)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (setting_key) DO UPDATE
       SET setting_value = EXCLUDED.setting_value,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()
       RETURNING setting_value, updated_at`,
      [GENERAL_SETTINGS_KEY, serialized, req.authenticatedUser.id],
    );
    return res.json({
      settings: rows[0].setting_value,
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error("[platform-settings] failed to save general settings:", error);
    return res.status(503).json({ error: "settings_unavailable" });
  }
});

export default router;
