import type { User } from "@/contexts/AuthContext";

export type ImpersonationMode = "VIEW_ONLY" | "FULL_ACCESS";

export interface ImpersonationSession {
  id: string;
  originalUser: User;
  impersonatedUser: User;
  clientId: string;
  mode: ImpersonationMode;
  startedAt: string;
  expiresAt: string;
  status: "active" | "ended" | "expired";
}

export interface ImpersonationAuditEntry {
  eventType: "IMPERSONATION_STARTED" | "IMPERSONATION_ENDED";
  originalUserId: string;
  impersonatedUserId: string;
  clientId: string;
  impersonationSessionId: string;
  timestamp: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  mode: ImpersonationMode;
  status: string;
}

const SESSION_KEY = "nido_impersonation_session";
const AUDIT_KEY = "nido_impersonation_audit";
export const IMPERSONATION_EVENT = "nidoImpersonationUpdated";
const ONE_HOUR_MS = 60 * 60 * 1000;

function getSessionStorage(): Storage {
  return window.sessionStorage;
}

function notify() {
  window.dispatchEvent(new Event(IMPERSONATION_EVENT));
}

function saveAudit(entry: ImpersonationAuditEntry) {
  try {
    let entries: ImpersonationAuditEntry[] = [];
    try { entries = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { /* ignore */ }
    localStorage.setItem(AUDIT_KEY, JSON.stringify([entry, ...entries].slice(0, 500)));
  } catch {
    // Ignore storage errors so audit logging cannot break logout/cleanup.
  }
}

export function getImpersonationSession(): ImpersonationSession | null {
  try {
    const raw = getSessionStorage().getItem(SESSION_KEY);
    if (!raw) return null;
    // Browser-only impersonation is temporarily disabled until server-side
    // impersonation is implemented; invalidate any leftover session safely
    // while preserving audit history.
    endImpersonation("revoked");
    return null;
  } catch {
    try {
      getSessionStorage().removeItem(SESSION_KEY);
    } catch {
      // Ignore unavailable sessionStorage.
    }
    return null;
  }
}

export function canStartImpersonation(
  originalUser: User,
  targetUser: User,
  hasServerImpersonationPermission = false,
): boolean {
  return originalUser.userType === "nido_admin" &&
    (targetUser.userType === "client_admin" || targetUser.userType === "client_user") &&
    Boolean(targetUser.clientId) &&
    hasServerImpersonationPermission;
}

export function startImpersonation(
  _originalUser: User,
  _targetUser: User,
  _hasServerImpersonationPermission = false,
): ImpersonationSession | null {
  // Temporarily disabled: browser-only impersonation does not establish a
  // real client-user Supabase session or enforce target RLS permissions.
  return null;
}

export function endImpersonation(reason: "ended" | "expired" | "revoked" = "ended"): void {
  try {
    const session = JSON.parse(getSessionStorage().getItem(SESSION_KEY) || "null") as ImpersonationSession | null;
    if (session) {
      const endedAt = new Date().toISOString();
      saveAudit({
        eventType: "IMPERSONATION_ENDED",
        originalUserId: session.originalUser.id,
        impersonatedUserId: session.impersonatedUser.id,
        clientId: session.clientId,
        impersonationSessionId: session.id,
        timestamp: endedAt,
        startedAt: session.startedAt,
        endedAt,
        durationSeconds: Math.max(
          0,
          Math.round((Date.parse(endedAt) - Date.parse(session.startedAt)) / 1000),
        ),
        mode: session.mode,
        status: reason,
      });
    }
  } catch {
    // Never allow sessionStorage unavailability to interrupt logout or cleanup.
  } finally {
    try {
      getSessionStorage().removeItem(SESSION_KEY);
    } catch {
      // Ignore unavailable sessionStorage.
    }
    notify();
  }
}

export function getImpersonationAudit(): ImpersonationAuditEntry[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
}