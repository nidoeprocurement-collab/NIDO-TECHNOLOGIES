// Shared localStorage store for support tickets so the SLA notification
// system can read them outside of SupportPage's local component state.

export interface SupportTicket {
  id: string;
  number: string;
  subject: string;
  status: string;   // "open" | "in_progress" | "resolved"
  priority: string; // "high" | "medium" | "low"
  created: string;  // YYYY-MM-DD
}

const KEY = "nido_support_tickets";

export function getSupportTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return [];
  }
}

export function saveSupportTickets(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent("supportTicketsUpdated"));
  } catch {
    // ignore
  }
}
