import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Home, ChevronRight, Headphones, User, Bold, Italic,
  Underline, List, ListOrdered, Link2, Upload, X, Send,
} from "lucide-react";
import { getClients, StoredClient } from "@/lib/clientStore";
import { getPrefix } from "@/lib/configService";
import { saveSupportTickets } from "@/lib/supportTicketStore";

// ── Static data ────────────────────────────────────────────────────────────────

const TICKET_CATEGORIES: Record<string, string[]> = {
  "Platform / System":   ["Login / Access", "Dashboard Issues", "Performance", "System Errors", "Feature Request"],
  "Billing / Payments":  ["Invoice Issues", "Payment Failure", "Refund Request", "Credit Note"],
  "Purchase Orders":     ["PO Creation", "PO Approval", "PO Delivery", "PO Amendment"],
  "Vendor Management":   ["Vendor Onboarding", "Vendor Portal", "Vendor Payments", "Vendor Dispute"],
  "User Management":     ["Account Setup", "Role / Permission", "Password Reset", "User Deactivation"],
  "General Enquiry":     ["Information Request", "Feedback", "Other"],
};

const DEPARTMENTS = ["IT Support", "Finance", "Operations", "Customer Success", "Management"];

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low",      color: "bg-green-100 text-green-700"  },
  { value: "medium",   label: "Medium",   color: "bg-amber-100 text-amber-700"  },
  { value: "high",     label: "High",     color: "bg-orange-100 text-orange-700"},
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700"      },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getExistingTickets(): { id: string; number: string; subject: string; status: string; priority: string; created: string }[] {
  try {
    const raw = localStorage.getItem("nido_support_tickets_v1");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CreateSupportTicketPage() {
  const navigate = useNavigate();
  const clients: StoredClient[] = getClients();

  // Form state
  const [clientId,     setClientId]     = useState("");
  const [category,     setCategory]     = useState("");
  const [subCategory,  setSubCategory]  = useState("");
  const [priority,     setPriority]     = useState("medium");
  const [subject,      setSubject]      = useState("");
  const [description,  setDescription]  = useState("");
  const [department,   setDepartment]   = useState("IT Support");
  const [ccEmail,      setCcEmail]      = useState("");
  const [files,        setFiles]        = useState<File[]>([]);
  const [dragging,     setDragging]     = useState(false);

  const descRef   = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Auto-fill account manager from selected client
  const selectedClient = clients.find(c => c.id === clientId);
  const accountManager = selectedClient?.rep || "";

  // Sub-category options driven by category
  const subCategories = category ? (TICKET_CATEGORIES[category] ?? []) : [];

  // Reset sub-category when category changes
  useEffect(() => { setSubCategory(""); }, [category]);

  // Sync description char count from contenteditable
  const handleDescInput = () => {
    if (descRef.current) setDescription(descRef.current.innerText);
  };

  // Rich-text formatting commands
  const execFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    descRef.current?.focus();
  };

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      ["application/pdf", "application/msword",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
       "image/jpeg", "image/png"].includes(f.type)
    );
    setFiles(prev => [...prev, ...dropped].slice(0, 5));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...picked].slice(0, 5));
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // Submit
  const handleSubmit = () => {
    if (!clientId)   { toast.error("Please select a client"); return; }
    if (!category)   { toast.error("Please select a category"); return; }
    if (!subCategory){ toast.error("Please select a sub category"); return; }
    if (!subject.trim()){ toast.error("Please enter a subject"); return; }
    const desc = descRef.current?.innerText?.trim() || "";
    if (!desc)       { toast.error("Please enter a description"); return; }

    const existing = getExistingTickets();
    const prefix   = getPrefix("supportTicket") || "TKT-";
    const newNum   = `${prefix}${String(existing.length + 1).padStart(3, "0")}`;

    const ticket = {
      id:          `tkt_${Date.now()}`,
      number:      newNum,
      subject:     subject.trim(),
      status:      "open",
      priority,
      created:     new Date().toISOString().split("T")[0],
      clientId,
      clientName:  selectedClient?.name || "",
      category,
      subCategory,
      description: desc,
      department,
      ccEmail,
      accountManager,
    };

    const updated = [...existing, ticket];
    localStorage.setItem("nido_support_tickets_v1", JSON.stringify(updated));
    saveSupportTickets(updated);
    toast.success("Support ticket created successfully");
    navigate("/support");
  };

  const priorityStyle = PRIORITY_OPTIONS.find(p => p.value === priority)?.color || "";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page header ── */}
      <div className="bg-transparent border-b border-border">
        <div className="w-full px-4 md:px-6 py-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Link to="/" className="hover:text-foreground flex items-center">
              <Home size={13} />
            </Link>
            <ChevronRight size={11} />
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <ChevronRight size={11} />
            <button onClick={() => navigate("/support")} className="hover:text-foreground">Tickets</button>
            <ChevronRight size={11} />
            <span className="text-primary font-medium">Create Ticket</span>
          </nav>

          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Create Support Ticket</h1>
              <p className="text-xs text-muted-foreground">Raise a new support request for your client</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form body ── */}
      <div className="w-full px-4 md:px-6 py-6 max-w-5xl">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">

          {/* Row 1: Client / Category / Sub Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                >
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-2.5 top-2.5 text-muted-foreground rotate-90 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                >
                  <option value="">Select category…</option>
                  {Object.keys(TICKET_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-2.5 top-2.5 text-muted-foreground rotate-90 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={subCategory}
                  onChange={e => setSubCategory(e.target.value)}
                  disabled={!category}
                  className="w-full appearance-none px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select sub category…</option>
                  {subCategories.map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-2.5 top-2.5 text-muted-foreground rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Account Manager / Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                <User size={15} className="text-muted-foreground flex-shrink-0" />
                <span>{accountManager || "Customer Relationship Manager (Auto Assigned)"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className={`w-full appearance-none px-3 py-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring pr-8 ${priorityStyle}`}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-2.5 top-2.5 text-muted-foreground rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description – rich text */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20">
                <select
                  onChange={e => execFormat("formatBlock", e.target.value)}
                  defaultValue="p"
                  className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none mr-2"
                >
                  <option value="p">Normal</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>
                <button type="button" onClick={() => execFormat("bold")}
                  className="p-1.5 rounded hover:bg-muted text-foreground" title="Bold">
                  <Bold size={14} />
                </button>
                <button type="button" onClick={() => execFormat("italic")}
                  className="p-1.5 rounded hover:bg-muted text-foreground" title="Italic">
                  <Italic size={14} />
                </button>
                <button type="button" onClick={() => execFormat("underline")}
                  className="p-1.5 rounded hover:bg-muted text-foreground" title="Underline">
                  <Underline size={14} />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button type="button" onClick={() => execFormat("insertUnorderedList")}
                  className="p-1.5 rounded hover:bg-muted text-foreground" title="Bullet list">
                  <List size={14} />
                </button>
                <button type="button" onClick={() => execFormat("insertOrderedList")}
                  className="p-1.5 rounded hover:bg-muted text-foreground" title="Numbered list">
                  <ListOrdered size={14} />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button type="button"
                  onClick={() => {
                    const url = window.prompt("Enter URL:");
                    if (url) execFormat("createLink", url);
                  }}
                  className="p-1.5 rounded hover:bg-muted text-foreground" title="Insert link">
                  <Link2 size={14} />
                </button>
              </div>

              {/* Editable area */}
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleDescInput}
                data-placeholder="Describe the issue in detail…"
                className="min-h-[140px] px-4 py-3 text-sm text-foreground focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
              />

              {/* Char count */}
              <div className="px-4 py-1.5 border-t border-border bg-muted/10 text-right">
                <span className={`text-xs ${description.length > 2800 ? "text-red-500" : "text-muted-foreground"}`}>
                  {description.length} / 3000
                </span>
              </div>
            </div>
          </div>

          {/* CC Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">CC Email (Optional)</label>
            <input
              type="text"
              value={ccEmail}
              onChange={e => setCcEmail(e.target.value)}
              placeholder="Enter up to 2 email addresses separated by comma"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">You can add maximum 2 email addresses.</p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Attachments (Optional)</label>

            {/* Attached files list */}
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs text-foreground border border-border">
                    <span className="max-w-[160px] truncate">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInput.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/20"
              }`}
            >
              <Upload size={22} className="text-muted-foreground mb-1" />
              <p className="text-sm text-muted-foreground">
                Drag &amp; drop files here or{" "}
                <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground">Max file size: 10MB each (PDF, DOC, DOCX, JPG, PNG)</p>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 mt-5 pb-8">
          <button
            type="button"
            onClick={() => navigate("/support")}
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Send size={15} />
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
