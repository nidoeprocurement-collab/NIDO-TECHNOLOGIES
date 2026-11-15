import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Table,
  Underline,
} from 'lucide-react';

export interface RichTextEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  allowTable?: boolean;
  disabled?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      onChange,
      placeholder = 'Enter content here...',
      minHeightClass = 'min-h-[220px]',
      allowTable = false,
      disabled = false,
    },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [paragraphSpacing, setParagraphSpacing] = useState<'normal' | 'relaxed'>('normal');
    const [fontSize, setFontSize] = useState<'2' | '3' | '4' | '5'>('3');
    const [textColor, setTextColor] = useState('#1e293b');
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('https://');

    useEffect(() => {
      if (!editorRef.current) return;
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }, [value]);

    const emitChange = () => {
      if (!editorRef.current) return;
      onChange(editorRef.current.innerHTML);
    };

    const exec = (command: string, commandValue?: string) => {
      if (disabled) return;
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      emitChange();
    };

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (disabled || !editorRef.current) return;
        editorRef.current.focus();
        const inserted = document.execCommand('insertText', false, text);
        if (!inserted) {
          editorRef.current.innerHTML += text;
        }
        emitChange();
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }));

    const handleInsertLink = () => {
      const url = linkUrl.trim();
      if (!url) return;
      exec('createLink', url);
      setLinkOpen(false);
      setLinkUrl('https://');
    };

    const handleInsertTable = () => {
      const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:8px 0;">
        <thead><tr><th style="border:1px solid #cbd5e1;padding:6px;text-align:left;background:#f8fafc;">Item</th><th style="border:1px solid #cbd5e1;padding:6px;text-align:right;background:#f8fafc;">Details</th></tr></thead>
        <tbody><tr><td style="border:1px solid #cbd5e1;padding:6px;">Sample Row</td><td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Value</td></tr></tbody>
      </table><p><br/></p>`;
      exec('insertHTML', tableHtml);
    };

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 px-2.5 py-2 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('bold')}
            title="Bold"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('italic')}
            title="Italic"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('underline')}
            title="Underline"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <Underline size={15} />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <select
            aria-label="Font size"
            disabled={disabled}
            value={fontSize}
            onChange={(e) => {
              const next = e.target.value as '2' | '3' | '4' | '5';
              setFontSize(next);
              exec('fontSize', next);
            }}
            className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
          >
            <option value="2">Small (12px)</option>
            <option value="3">Normal (14px)</option>
            <option value="4">Medium (16px)</option>
            <option value="5">Large (18px)</option>
          </select>

          <label className="inline-flex items-center gap-1 px-1.5 py-1 rounded hover:bg-slate-200/70 cursor-pointer text-xs text-slate-600" title="Font colour">
            <span>A</span>
            <input
              type="color"
              disabled={disabled}
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                exec('foreColor', e.target.value);
              }}
              className="w-4 h-4 p-0 border-0 bg-transparent cursor-pointer"
            />
          </label>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('justifyLeft')}
            title="Align Left"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <AlignLeft size={15} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('justifyCenter')}
            title="Align Center"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <AlignCenter size={15} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('justifyRight')}
            title="Align Right"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <AlignRight size={15} />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('insertUnorderedList')}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => exec('insertOrderedList')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <ListOrdered size={15} />
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setLinkOpen((v) => !v)}
            title="Insert Hyperlink"
            className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
          >
            <LinkIcon size={15} />
          </button>

          {allowTable && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleInsertTable}
              title="Insert Table"
              className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-40"
            >
              <Table size={15} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setParagraphSpacing((prev) => (prev === 'normal' ? 'relaxed' : 'normal'))}
            className="ml-auto px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100"
            title="Toggle paragraph spacing"
          >
            Spacing: {paragraphSpacing === 'normal' ? 'Compact' : 'Relaxed'}
          </button>
        </div>

        {linkOpen && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/70 border-b border-slate-200">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
            />
            <button
              type="button"
              onClick={handleInsertLink}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Link
            </button>
            <button
              type="button"
              onClick={() => setLinkOpen(false)}
              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emitChange}
          data-placeholder={placeholder}
          className={`${minHeightClass} p-3.5 text-sm text-slate-800 focus:outline-none prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-blue-600 [&_a]:underline ${
            paragraphSpacing === 'relaxed' ? '[&_p]:mb-3 [&_li]:mb-2 leading-relaxed' : '[&_p]:mb-1.5 [&_li]:mb-1 leading-normal'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
        />
      </div>
    );
  },
);

