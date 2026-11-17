// Browser Web Crypto API (AES-256-GCM) + IndexedDB encrypted payload vault.
// Stores encrypted licence keys/files locally in IndexedDB so real downloads and decryption work live
// without placing raw keys or file blobs into localStorage.

const DB_NAME = 'nido_secure_provisioning_vault_v1';
const STORE_NAME = 'encrypted_licences';

interface VaultEntry {
  licenceId: string;
  kind: 'key' | 'file';
  fileName?: string;
  mimeType?: string;
  iv: number[];
  rawKeyJwk: JsonWebKey;
  ciphertext: ArrayBuffer;
  sha256Fingerprint: string;
  encryptedAt: string;
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'licenceId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateCryptographicToken(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateCryptographicOtp(length = 6): string {
  const digits: string[] = [];
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    digits.push(String(arr[i] % 10));
  }
  return digits.join('');
}

export async function encryptAndStoreInVault(params: {
  licenceId: string;
  kind: 'key' | 'file';
  data: Uint8Array;
  fileName?: string;
  mimeType?: string;
}): Promise<{ sha256Fingerprint: string }> {
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBuffer = new Uint8Array(params.data).buffer;
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plainBuffer,
  );
  const digest = await crypto.subtle.digest('SHA-256', ciphertext);
  const sha256Fingerprint = toHex(digest).slice(0, 24).toUpperCase();
  const rawKeyJwk = await crypto.subtle.exportKey('jwk', aesKey);

  const entry: VaultEntry = {
    licenceId: params.licenceId,
    kind: params.kind,
    fileName: params.fileName,
    mimeType: params.mimeType,
    iv: Array.from(iv),
    rawKeyJwk,
    ciphertext,
    sha256Fingerprint,
    encryptedAt: new Date().toISOString(),
  };

  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return { sha256Fingerprint };
}

export async function getVaultEntry(licenceId: string): Promise<VaultEntry | null> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(licenceId);
    req.onsuccess = () => resolve((req.result as VaultEntry) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeVaultEntry(licenceId: string): Promise<void> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(licenceId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function decryptFromVault(licenceId: string): Promise<{
  bytes: Uint8Array;
  kind: 'key' | 'file';
  fileName?: string;
  mimeType?: string;
  sha256Fingerprint: string;
} | null> {
  const entry = await getVaultEntry(licenceId);
  if (!entry) return null;

  const aesKey = await crypto.subtle.importKey(
    'jwk',
    entry.rawKeyJwk,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(entry.iv) },
    aesKey,
    entry.ciphertext,
  );
  return {
    bytes: new Uint8Array(plain),
    kind: entry.kind,
    fileName: entry.fileName,
    mimeType: entry.mimeType,
    sha256Fingerprint: entry.sha256Fingerprint,
  };
}

