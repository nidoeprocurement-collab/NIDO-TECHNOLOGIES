import { useId, useRef } from "react";
import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";
import {
  DEFAULT_DOCUMENT_TYPE_SUGGESTIONS,
  MAX_DOCUMENT_BYTES,
  createDocumentDraft,
  downloadStoredDocument,
  formatFileSize,
  type LabeledDocumentDraft,
  type StoredLabeledDocument,
} from "@/lib/labeledDocuments";

interface LabeledDocumentUploaderProps {
  documents: LabeledDocumentDraft[];
  onChange: (documents: LabeledDocumentDraft[]) => void;
  accept?: string;
  maxFileBytes?: number;
  suggestions?: string[];
  onError?: (message: string) => void;
}

export default function LabeledDocumentUploader({
  documents,
  onChange,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png",
  maxFileBytes = MAX_DOCUMENT_BYTES,
  suggestions = DEFAULT_DOCUMENT_TYPE_SUGGESTIONS,
  onError,
}: LabeledDocumentUploaderProps) {
  const multiInputRef = useRef<HTMLInputElement>(null);
  const datalistId = `doc-type-suggestions-${useId().replace(/:/g, "")}`;
  const rows = documents.length ? documents : [createDocumentDraft()];

  const reportError = (message: string) => {
    if (onError) onError(message);
    else alert(message);
  };

  const updateRow = (id: string, patch: Partial<LabeledDocumentDraft>) => {
    const base = documents.length ? documents : rows;
    onChange(base.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    const base = documents.length ? documents : rows;
    onChange(base.filter((row) => row.id !== id));
  };

  const addRow = () => {
    const base = documents.length ? documents : rows;
    onChange([...base, createDocumentDraft()]);
  };

  const acceptFile = (file: File | undefined | null): File | null => {
    if (!file) return null;
    if (file.size > maxFileBytes) {
      reportError(`"${file.name}" exceeds the ${formatFileSize(maxFileBytes)} limit.`);
      return null;
    }
    return file;
  };

  const handleMultiple = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).map(acceptFile).filter((file): file is File => !!file);
    if (!accepted.length) return;
    // Drop blank rows, then add one row per selected file so each can be labeled.
    const base = (documents.length ? documents : rows).filter(
      (row) => row.file || row.label.trim(),
    );
    onChange([...base, ...accepted.map((file) => createDocumentDraft(file))]);
  };

  return (
    <div className="space-y-3">
      <datalist id={datalistId}>
        {suggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-3 items-end rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Document Type / Name {index + 1} *
            </label>
            <input
              type="text"
              list={datalistId}
              value={row.label}
              onChange={(event) => updateRow(row.id, { label: event.target.value })}
              placeholder="e.g. GST Certificate"
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File *</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm hover:border-blue-400 hover:bg-blue-50/40">
              {row.file ? (
                <>
                  <FileText size={16} className="shrink-0 text-blue-500" />
                  <span className="truncate text-gray-700">{row.file.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">{formatFileSize(row.file.size)}</span>
                </>
              ) : (
                <>
                  <Upload size={16} className="shrink-0 text-gray-400" />
                  <span className="text-gray-500">Choose file to upload</span>
                </>
              )}
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(event) => {
                  const file = acceptFile(event.target.files?.[0]);
                  if (file) updateRow(row.id, { file });
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            title="Remove document"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <Plus size={15} /> Add Another Document
        </button>
        <button
          type="button"
          onClick={() => multiInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Upload size={15} /> Select Multiple Files
        </button>
        <input
          ref={multiInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(event) => {
            handleMultiple(event.target.files);
            event.target.value = "";
          }}
        />
        <span className="text-xs text-gray-400">
          PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — max {formatFileSize(maxFileBytes)} each
        </span>
      </div>
    </div>
  );
}

/** Read-only list of stored documents with labels and download buttons (used on Overview pages). */
export function StoredDocumentList({
  documents,
  emptyMessage = "No documents uploaded.",
  onMissingFile,
}: {
  documents: StoredLabeledDocument[];
  emptyMessage?: string;
  onMissingFile?: (doc: StoredLabeledDocument) => void;
}) {
  if (!documents.length) {
    return <p className="py-4 text-center text-xs text-gray-400">{emptyMessage}</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {documents.map((doc, index) => (
        <li key={doc.id || `${doc.name}-${index}`} className="flex items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <FileText size={15} className="text-blue-500" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-800">{doc.label || doc.name}</p>
              <p className="truncate text-[11px] text-gray-400">
                {doc.name}
                {doc.size ? ` · ${doc.size}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!downloadStoredDocument(doc)) onMissingFile?.(doc);
            }}
            title="Download"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
          >
            <Download size={13} /> Download
          </button>
        </li>
      ))}
    </ul>
  );
}
