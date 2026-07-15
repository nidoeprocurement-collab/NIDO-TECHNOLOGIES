// Encrypts sensitive config values (e.g. provider API keys) at rest using
// AES-256-GCM, with a key derived from SESSION_SECRET. Never log or return
// decrypted values to the frontend.
import crypto from "node:crypto";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is required to encrypt/decrypt sensitive email configuration values.",
    );
  }
  return secret;
}

function deriveKey(salt) {
  return crypto.scryptSync(getSecret(), salt, 32);
}

export function encryptSecret(plainText) {
  if (plainText == null || plainText === "") return null;
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload) {
  if (!payload) return null;
  try {
    const buf = Buffer.from(payload, "base64");
    const salt = buf.subarray(0, 16);
    const iv = buf.subarray(16, 28);
    const tag = buf.subarray(28, 44);
    const encrypted = buf.subarray(44);
    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[crypto] failed to decrypt secret", err.message);
    return null;
  }
}
