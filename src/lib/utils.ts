export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

export const MAX_CANCELLATION_REASON_WORDS = 100;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function enforceMaxWords(text: string, maxWords = MAX_CANCELLATION_REASON_WORDS): string {
  const matches = Array.from(text.matchAll(/\S+/g));
  if (matches.length <= maxWords) return text;
  const lastAllowed = matches[maxWords - 1];
  const cutoff = (lastAllowed.index ?? 0) + lastAllowed[0].length;
  return text.slice(0, cutoff);
}

/**
 * Extracts a clickable URL (if present) and display label from a tracking info object.
 */
export function resolveTrackingLink(tracking: {
  linkUrl?: string;
  url?: string;
  linkLabel?: string;
  link?: string;
} | null | undefined): { href: string | null; label: string } {
  if (!tracking) return { href: null, label: "" };
  const rawLabel = String(tracking.linkLabel || tracking.link || "").trim();
  const explicitUrl = String(tracking.linkUrl || tracking.url || "").trim();
  const candidate = explicitUrl || rawLabel;
  const looksLikeUrl =
    /^https?:\/\//i.test(candidate) ||
    /^www\./i.test(candidate) ||
    (/^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(candidate) && !candidate.includes("@"));

  const href = looksLikeUrl
    ? /^https?:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`
    : null;

  return {
    href,
    label: rawLabel || explicitUrl || "Track Package",
  };
}
