// Simple {{variable}} substitution used for email subjects and bodies.
const VAR_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplate(str, variables = {}) {
  if (!str) return str || "";
  return str.replace(VAR_PATTERN, (_match, key) => {
    const value = variables[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function extractVariables(str) {
  if (!str) return [];
  const matches = [...str.matchAll(VAR_PATTERN)];
  return [...new Set(matches.map((m) => m[1]))];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_PATTERN.test(email.trim());
}
