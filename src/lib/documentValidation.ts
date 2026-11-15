import { toast } from "@/hooks/use-toast";

/**
 * Checks a list of missing field labels and shows a destructive popup notification
 * listing every missed field when the user tries to save a document.
 *
 * Returns `true` when all required fields are present (no missing fields).
 */
export function validateRequiredDocumentFields(
  checks: Array<{ label: string; valid: boolean }>,
  documentName = "document",
): boolean {
  const missing = checks.filter((c) => !c.valid).map((c) => c.label);
  if (missing.length === 0) return true;

  toast({
    variant: "destructive",
    title: `Missing Required ${missing.length === 1 ? "Field" : "Fields"}`,
    description: `Please enter the following before saving this ${documentName}: ${missing.join(", ")}.`,
  });
  return false;
}

