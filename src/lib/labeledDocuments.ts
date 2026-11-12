// Shared helpers for labeled document uploads (client onboarding, vendor onboarding, overview pages).

/** One document row being prepared in a form: a user-written label plus its file. */
export interface LabeledDocumentDraft {
  id: string;
  label: string;
  file: File | null;
}

/** A persisted labeled document (file contents stored as a data URL). */
export interface StoredLabeledDocument {
  id?: string;
  label?: string;
  name: string;
  size?: string;
  sizeBytes?: number;
  type?: string;
  fileData?: string;
  uploadedOn?: string;
}

export const DEFAULT_DOCUMENT_TYPE_SUGGESTIONS = [
  "GST Certificate",
  "PAN Card",
  "Business Registration",
  "Cancelled Cheque",
  "Bank Details",
  "ISO Certificate",
  "MSME Certificate",
  "Contract / Agreement",
  "NDA",
  "Address Proof",
  "Other",
];

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createDocumentDraft(file: File | null = null, label = ""): LabeledDocumentDraft {
  return { id: newId(), label, file };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Return an error message when the drafts are incomplete, otherwise null. */
export function validateDocumentDrafts(drafts: LabeledDocumentDraft[]): string | null {
  for (const draft of drafts) {
    const hasLabel = draft.label.trim() !== "";
    if (draft.file && !hasLabel) {
      return `Please enter the document type for "${draft.file.name}".`;
    }
    if (hasLabel && !draft.file) {
      return `Please choose a file for "${draft.label.trim()}".`;
    }
  }
  return null;
}

/** Convert completed drafts into storable records (empty rows are skipped). */
export async function draftsToStoredDocuments(
  drafts: LabeledDocumentDraft[],
): Promise<StoredLabeledDocument[]> {
  const uploadedOn = new Date().toISOString();
  const completed = drafts.filter((draft) => draft.file && draft.label.trim());
  return Promise.all(
    completed.map(async (draft) => {
      const file = draft.file as File;
      return {
        id: `DOC-${newId()}`,
        label: draft.label.trim(),
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        type: file.type || "application/octet-stream",
        fileData: await readFileAsDataUrl(file),
        uploadedOn,
      };
    }),
  );
}

/** Trigger a browser download for a stored document. Returns false when no file data exists. */
export function downloadStoredDocument(doc: { fileData?: string; name?: string; label?: string }): boolean {
  if (!doc.fileData) return false;
  const link = document.createElement("a");
  link.href = doc.fileData;
  link.download = doc.name || doc.label || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
