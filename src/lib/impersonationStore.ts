import type { User } from "@/contexts/AuthContext";
import { getPortalUsers } from "@/lib/portalUserStore";
import { hasPermission } from "@/lib/permissionsStore";

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
  mode: ImpersonationMode;
  status: string;
}

const SESSION_KEY = "nido_impersonation_session";
const AUDIT_KEY = "nido_impersonation_audit";
export const IMPERSONATION_EVENT = "nidoImpersonationUpdated";
const ONE_HOUR_MS = 60 * 60 * 1000;

function notify() {
  window.dispatchEvent(new Event(IMPERSONATION_EVENT));
}

function saveAudit(entry: ImpersonationAuditEntry) {
  let entries: ImpersonationAuditEntry[] = [];
  try { entries = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { /* ignore */ }
  localStorage.setItem(AUDIT_KEY, JSON.stringify([entry, ...entries].slice(0, 500)));
}

export function getImpersonationSession(): ImpersonationSession | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as ImpersonationSession | null;
    if (!session) return null;
    if (session.expiresAt <= new Date().toISOString()) {
      endImpersonation("expired");
      return null;
    }
    const target = getPortalUsers().find((u) => u.id === session.impersonatedUser.id);
    if (!target || target.status !== "active" || !canStartImpersonation(session.originalUser, session.impersonatedUser)) {
      endImpersonation("revoked");
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function canStartImpersonation(originalUser: User, targetUser: User): boolean {
  return originalUser.userType === "nido_admin" &&
    targetUser.userType !== "nido_admin" &&
    Boolean(targetUser.clientId) &&
    hasPermission(originalUser.role || "", "client_user_impersonation", "manage");
}

export function startImpersonation(originalUser: User, targetUser: User): ImpersonationSession | null {
  if (!canStartImpersonation(originalUser, targetUser)) return null;
  const now = new Date();
  const session: ImpersonationSession = {
    id: `imp-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    originalUser,
    impersonatedUser: { ...targetUser, userType: "client_user" },
    clientId: targetUser.clientId!,
    mode: "VIEW_ONLY",
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ONE_HOUR_MS).toISOString(),
    status: "active",
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  saveAudit({
    eventType: "IMPERSONATION_STARTED",
    originalUserId: originalUser.id,
    impersonatedUserId: targetUser.id,
    clientId: session.clientId,
    impersonationSessionId: session.id,
    timestamp: now.toISOString(),
    startedAt: session.startedAt,
    mode: session.mode,
    status: session.status,
  });
  notify();
  return session;
}

export function endImpersonation(reason: "ended" | "expired" | "revoked" = "ended"): void {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as ImpersonationSession | null;
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
        mode: session.mode,
        status: reason,
      });
    }
  } finally {
    localStorage.removeItem(SESSION_KEY);
    notify();
  }
}

export function getImpersonationAudit(): ImpersonationAuditEntry[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
}