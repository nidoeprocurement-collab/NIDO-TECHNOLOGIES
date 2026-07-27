import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getInvoices,
  saveInvoice,
  generateInvoiceNumber,
  type StoredInvoice,
} from "@/lib/invoiceStore";
import { getClients, type StoredClient } from "@/lib/clientStore";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, X } from "lucide-react";

// ── safeReadJson ──────────────────────────────────────────────────────────────
function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

// ── types ─────────────────────────────────────────────────────────────────────
type Frequency = "weekly" | "monthly" | "quarterly";
type RecurringStatus = "active" | "stopped";

interface RecurringItem {
  itemName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
}

interface RecurringInvoiceProfile {
  id: string;
  profileName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPan: string;
  customerGstin: string;
  frequency: Frequency;
  startOn: string;
  endsOn: string;
  neverExpires: boolean;
  paymentTerms: string;
  orderNumber: string;
  nextInvoiceDate: string;
  lastInvoiceDate: string;
  placeOfSupply: string;
  billingAddress: string;
  shippingAddress: string;
  item: RecurringItem;
  shippingCharges: number;
  adjustment: number;
  tds: number;
  roundOff: number;
  amount: number;
  status: RecurringStatus;
  notes: string;
  termsAndConditions: string;
  createAsDraft: boolean;
  childInvoiceIds: string[];
  recentActivities: {
    id: string;
    message: string;
    by: string;
    timestamp: string;
  }[];
}

// ── constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "nido_recurring_invoices_v3";

const todayStr = () => new Date().toISOString().slice(0, 10);

const addByFrequency = (date: string, frequency: Frequency) => {
  const base = new Date(`${date}T00:00:00`);
  if (frequency === "weekly") base.setDate(base.getDate() + 7);
  if (frequency === "monthly") base.setMonth(base.getMonth() + 1);
  if (frequency === "quarterly") base.setMonth(base.getMonth() + 3);
  return base.toISOString().slice(0, 10);
};

const lineAmount = (item: RecurringItem) =>
  Math.max(0, item.quantity * item.rate - item.discount);

const computeTotals = (
  item: RecurringItem,
  shippingCharges: number,
  adjustment: number,
  tds: number,
  roundOff: number,
) => {
  const subtotal = lineAmount(item);
  const tax = (subtotal * item.taxRate) / 100;
  const total = subtotal + tax + shippingCharges + adjustment - tds + roundOff;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// ── default / seed data ───────────────────────────────────────────────────────
const defaultProfile: RecurringInvoiceProfile = {
  id: "ri-1",
  profileName: "Design",
  customerName: "Nido Technologies",
  customerEmail: "pavannido@gmail.com",
  customerPhone: "9844440412",
  customerPan: "BPAPP1867G",
  customerGstin: "29BPAPP1867G1ZN",
  frequency: "weekly",
  startOn: "2026-04-02",
  endsOn: "",
  neverExpires: true,
  paymentTerms: "Due on Receipt",
  orderNumber: "",
  placeOfSupply: "Karnataka (29)",
  billingAddress:
    "Nido Technologies\n41/1, 2nd Floor, 10th Cross,\n11th Main, Wilsongarden,\nBangalore\nKarnataka 560027\nIndia\nPhone: 9844440412",
  shippingAddress:
    "Nido Technologies\n41/1, 2nd Floor, 10th Cross,\n11th Main, Wilsongarden,\nBangalore\nKarnataka 560027\nIndia\nPhone: 9844440412",
  item: {
    itemName: "3D Design Model",
    description: "3D Model Mould Designs for Handel.",
    hsnSac: "9983",
    quantity: 1,
    rate: 400,
    discount: 0,
    taxRate: 18,
  },
  shippingCharges: 0,
  adjustment: 0,
  tds: 0,
  roundOff: 0,
  amount: 472,
  status: "active",
  notes: "Thanks for your business.",
  termsAndConditions:
    "1. The particulars shown in the tax invoice are true and correct.\n2. Any changes/re-work in the manufactured gauge should be intimated before 20 days.",
  createAsDraft: true,
  childInvoiceIds: [],
  recentActivities: [
    {
      id: "ra-1",
      message: "Recurring invoice created for Rs.472.00",
      by: "nidotechnologies",
      timestamp: "2026-04-02T20:07:00.000Z",
    },
  ],
  nextInvoiceDate: "2026-04-09",
  lastInvoiceDate: "2026-04-02",
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeProfile = (
  raw: Partial<RecurringInvoiceProfile>,
): RecurringInvoiceProfile => {
  const item: RecurringItem = {
    itemName: raw.item?.itemName || "3D Design Model",
    description: raw.item?.description || "",
    hsnSac: raw.item?.hsnSac || "",
    quantity: toNumber(raw.item?.quantity, 1),
    rate: toNumber(raw.item?.rate, 0),
    discount: toNumber(raw.item?.discount, 0),
    taxRate: toNumber(raw.item?.taxRate, 18),
  };
  const shippingCharges = toNumber(raw.shippingCharges, 0);
  const adjustment = toNumber(raw.adjustment, 0);
  const tds = toNumber(raw.tds, 0);
  const roundOff = toNumber(raw.roundOff, 0);
  const totals = computeTotals(item, shippingCharges, adjustment, tds, roundOff);

  return {
    ...defaultProfile,
    ...raw,
    item,
    shippingCharges,
    adjustment,
    tds,
    roundOff,
    amount: toNumber(raw.amount, totals.total),
    childInvoiceIds: Array.isArray(raw.childInvoiceIds) ? raw.childInvoiceIds : [],
    recentActivities: Array.isArray(raw.recentActivities) ? raw.recentActivities : [],
  };
};

const emptyForm = (): Omit<RecurringInvoiceProfile, "id" | "recentActivities" | "childInvoiceIds"> => ({
  profileName: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerPan: "",
  customerGstin: "",
  frequency: "weekly",
  startOn: todayStr(),
  endsOn: "",
  neverExpires: true,
  paymentTerms: "Due on Receipt",
  orderNumber: "",
  placeOfSupply: "",
  billingAddress: "",
  shippingAddress: "",
  item: {
    itemName: "",
    description: "",
    hsnSac: "",
    quantity: 1,
    rate: 0,
    discount: 0,
    taxRate: 18,
  },
  shippingCharges: 0,
  adjustment: 0,
  tds: 0,
  roundOff: 0,
  amount: 0,
  status: "active",
  notes: "Thanks for your business.",
  termsAndConditions:
    "1. The particulars shown in the tax invoice are true and correct.\n2. Any changes/re-work in the manufactured gauge should be intimated before 20 days.",
  createAsDraft: true,
  nextInvoiceDate: "",
  lastInvoiceDate: "",
});

const frequencyLabel: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

// ── ConfirmationDialog (inline) ───────────────────────────────────────────────
interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone: "default" | "destructive";
  onConfirm: () => void;
}

function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  tone,
  onOpenChange,
  onConfirm,
}: ConfirmState & { onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Next Invoice Preview ──────────────────────────────────────────────────────
function NextInvoicePreview({ profile }: { profile: RecurringInvoiceProfile }) {
  const subtotal = lineAmount(profile.item);
  const tax = (subtotal * profile.item.taxRate) / 100;
  const halfTax = Math.round((tax / 2) * 100) / 100;

  return (
    <div className="rounded-xl border bg-white p-6 space-y-6 text-sm">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Tax Invoice (Preview)</p>
          <p className="text-2xl font-bold text-primary">Will be generated automatically</p>
          <p className="text-muted-foreground mt-1">Next Invoice Date: <b>{profile.nextInvoiceDate || "—"}</b></p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-base">Nido Technologies</p>
          <p className="text-muted-foreground text-xs">GSTIN: 29BPAPP1867G1ZN</p>
        </div>
      </div>

      {/* Bill to / Ship to */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Bill To</p>
          <p className="font-medium">{profile.customerName}</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{profile.billingAddress}</p>
          {profile.customerGstin && <p className="text-xs mt-1">GSTIN: {profile.customerGstin}</p>}
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Details</p>
          <p>Payment Terms: <b>{profile.paymentTerms}</b></p>
          <p>Place of Supply: <b>{profile.placeOfSupply || "—"}</b></p>
          <p>Frequency: <b>{frequencyLabel[profile.frequency]}</b></p>
        </div>
      </div>

      {/* Item table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-3 py-2">Item</th>
              <th className="text-left px-3 py-2">HSN/SAC</th>
              <th className="text-right px-3 py-2">Qty</th>
              <th className="text-right px-3 py-2">Rate</th>
              <th className="text-right px-3 py-2">Discount</th>
              <th className="text-right px-3 py-2">Tax ({profile.item.taxRate}%)</th>
              <th className="text-right px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-3 py-3">
                <p className="font-medium">{profile.item.itemName}</p>
                {profile.item.description && (
                  <p className="text-xs text-muted-foreground">{profile.item.description}</p>
                )}
              </td>
              <td className="px-3 py-3 text-muted-foreground">{profile.item.hsnSac || "—"}</td>
              <td className="px-3 py-3 text-right">{profile.item.quantity}</td>
              <td className="px-3 py-3 text-right">Rs.{profile.item.rate.toFixed(2)}</td>
              <td className="px-3 py-3 text-right">Rs.{profile.item.discount.toFixed(2)}</td>
              <td className="px-3 py-3 text-right">Rs.{tax.toFixed(2)}</td>
              <td className="px-3 py-3 text-right font-semibold">Rs.{(subtotal + tax).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Sub Total</span><span>Rs.{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>CGST ({profile.item.taxRate / 2}%)</span><span>Rs.{halfTax.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>SGST ({profile.item.taxRate / 2}%)</span><span>Rs.{halfTax.toFixed(2)}</span></div>
          {profile.shippingCharges > 0 && (
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>Rs.{profile.shippingCharges.toFixed(2)}</span></div>
          )}
          {profile.tds > 0 && (
            <div className="flex justify-between text-muted-foreground"><span>TDS</span><span>-Rs.{profile.tds.toFixed(2)}</span></div>
          )}
          {profile.adjustment !== 0 && (
            <div className="flex justify-between text-muted-foreground"><span>Adjustment</span><span>Rs.{profile.adjustment.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2 text-base"><span>Total (Rs)</span><span>Rs.{profile.amount.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Notes */}
      {profile.notes && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Customer Notes</p>
          <p className="text-muted-foreground">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function RecurringInvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [clients, setClients] = useState<StoredClient[]>([]);
  const [allInvoices, setAllInvoices] = useState<StoredInvoice[]>([]);

  useEffect(() => {
    setClients(getClients());
    setAllInvoices(getInvoices());
    const handler = () => setAllInvoices(getInvoices());
    window.addEventListener("nidoInvoicesUpdated", handler);
    return () => window.removeEventListener("nidoInvoicesUpdated", handler);
  }, []);

  const createMode = location.pathname.endsWith("/create");
  const editMode = location.pathname.endsWith("/edit") && !!params.id;

  const [profiles, setProfiles] = useState<RecurringInvoiceProfile[]>(() => {
    const stored = safeReadJson<RecurringInvoiceProfile[]>(STORAGE_KEY, [defaultProfile]);
    const list = Array.isArray(stored) && stored.length > 0 ? stored : [defaultProfile];
    return list.map((entry) => normalizeProfile(entry));
  });

  const [selectedId, setSelectedId] = useState<string>(
    params.id || profiles[0]?.id || "",
  );

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    tone: "default",
    onConfirm: () => {},
  });

  const [formOpen, setFormOpen] = useState(createMode);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const persist = (next: RecurringInvoiceProfile[]) => {
    setProfiles(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (params.id) setSelectedId(params.id);
  }, [params.id]);

  useEffect(() => {
    if (createMode) {
      setEditingId(null);
      setForm(emptyForm());
      setFormOpen(true);
    }
  }, [createMode]);

  useEffect(() => {
    if (!editMode) return;
    const current = profiles.find((entry) => entry.id === params.id);
    if (!current) return;
    setEditingId(current.id);
    const { id: _id, recentActivities: _ra, childInvoiceIds: _ci, ...payload } = current;
    setForm(payload);
    setFormOpen(true);
  }, [editMode, params.id]);

  const selected = profiles.find((entry) => entry.id === selectedId) || profiles[0] || null;

  const totals = useMemo(
    () => computeTotals(form.item, toNumber(form.shippingCharges), toNumber(form.adjustment), toNumber(form.tds), toNumber(form.roundOff)),
    [form],
  );

  // child invoices: stored invoices whose poReference is `recurring:<profileId>`
  const profileInvoices = useMemo(() => {
    if (!selected) return [] as StoredInvoice[];
    return allInvoices.filter((entry) => entry.poReference === `recurring:${selected.id}`);
  }, [allInvoices, selected]);

  const upsertActivity = (profileId: string, message: string, nextProfiles: RecurringInvoiceProfile[]) => {
    return nextProfiles.map((entry) =>
      entry.id === profileId
        ? {
            ...entry,
            recentActivities: [
              { id: `ra-${Date.now()}`, message, by: "System", timestamp: new Date().toISOString() },
              ...entry.recentActivities,
            ],
          }
        : entry,
    );
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    navigate("/sales/recurring-invoices/create");
  };

  const openEdit = () => {
    if (!selected) return;
    const { id: _id, recentActivities: _ra, childInvoiceIds: _ci, ...payload } = selected;
    setEditingId(selected.id);
    setForm(payload);
    setFormOpen(true);
    navigate(`/sales/recurring-invoices/${selected.id}/edit`);
  };

  const closeDialog = () => {
    setFormOpen(false);
    setEditingId(null);
    navigate("/sales/recurring-invoices", { replace: true });
  };

  const saveProfile = () => {
    if (!form.customerName.trim() || !form.profileName.trim()) {
      toast.error("Customer Name and Profile Name are required");
      return;
    }

    const nextInvoiceDate = addByFrequency(form.startOn, form.frequency);
    const computed = computeTotals(form.item, form.shippingCharges, form.adjustment, form.tds, form.roundOff);

    if (editingId) {
      const next = profiles.map((entry) =>
        entry.id === editingId ? { ...entry, ...form, amount: computed.total, nextInvoiceDate } : entry,
      );
      const withActivity = upsertActivity(editingId, "Recurring invoice profile updated", next);
      persist(withActivity);
      setSelectedId(editingId);
      toast.success("Recurring profile updated");
      closeDialog();
      return;
    }

    const created: RecurringInvoiceProfile = {
      id: `ri-${Date.now()}`,
      ...form,
      amount: computed.total,
      nextInvoiceDate,
      lastInvoiceDate: form.startOn,
      childInvoiceIds: [],
      recentActivities: [
        {
          id: `ra-${Date.now()}`,
          message: `Recurring invoice created for Rs.${computed.total.toFixed(2)}`,
          by: "System",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const next = [created, ...profiles];
    persist(next);
    setSelectedId(created.id);
    toast.success("Recurring invoice profile created");
    closeDialog();
  };

  const handleCreateChildInvoice = () => {
    if (!selected) return;

    const subtotal = lineAmount(selected.item);
    const tax = (subtotal * selected.item.taxRate) / 100;
    const cgst = Math.round((tax / 2) * 100) / 100;
    const sgst = Math.round((tax / 2) * 100) / 100;
    const grandTotal =
      Math.round((subtotal + tax + selected.shippingCharges + selected.adjustment - selected.tds + selected.roundOff) * 100) / 100;

    const now = new Date().toISOString();
    const invNumber = generateInvoiceNumber();
    const invId = `rinv-${Date.now()}`;

    const newInvoice: StoredInvoice = {
      id: invId,
      invoiceNumber: invNumber,
      clientName: selected.customerName,
      contactPerson: selected.customerName,
      clientGstin: selected.customerGstin,
      clientContact: selected.customerEmail,
      billingAddress: selected.billingAddress,
      shippingAddress: selected.shippingAddress,
      invoiceDate: todayStr(),
      dueDate: selected.nextInvoiceDate || todayStr(),
      poReference: `recurring:${selected.id}`,
      placeOfSupply: selected.placeOfSupply,
      status: selected.createAsDraft ? "Draft" : "Sent",
      lineItems: [
        {
          id: `rli-${Date.now()}`,
          description: selected.item.itemName,
          itemDetails: selected.item.description,
          hsnSac: selected.item.hsnSac,
          quantity: selected.item.quantity,
          rate: selected.item.rate,
          discount: selected.item.discount,
          taxPercent: selected.item.taxRate,
          taxType: "CGST+SGST",
        },
      ],
      grossSubtotal: subtotal + selected.item.discount,
      totalDiscount: selected.item.discount,
      subtotal,
      totalTax: cgst + sgst,
      shippingCharges: selected.shippingCharges,
      adjustment: selected.adjustment + selected.roundOff,
      grandTotal,
      notes: selected.notes,
      termsConditions: selected.termsAndConditions,
      payments: [],
      activity: [
        { id: `act-${Date.now()}`, date: todayStr(), title: "Invoice created", description: `Generated from recurring profile: ${selected.profileName}` },
      ],
      createdAt: now,
      updatedAt: now,
    };

    saveInvoice(newInvoice);

    const next = profiles.map((entry) =>
      entry.id === selected.id
        ? {
            ...entry,
            lastInvoiceDate: todayStr(),
            nextInvoiceDate: addByFrequency(todayStr(), entry.frequency),
            childInvoiceIds: [invId, ...entry.childInvoiceIds],
            recentActivities: [
              {
                id: `ra-${Date.now()}`,
                message: `Invoice created - ${invNumber}. Saved as ${selected.createAsDraft ? "draft" : "sent"}`,
                by: "System",
                timestamp: now,
              },
              ...entry.recentActivities,
            ],
          }
        : entry,
    );

    persist(next);
    toast.success("Child invoice generated");
    navigate(`/sales/invoices/${invId}`);
  };

  const handleClone = () => {
    if (!selected) return;
    const cloned: RecurringInvoiceProfile = {
      ...selected,
      id: `ri-${Date.now()}`,
      profileName: `${selected.profileName} Copy`,
      childInvoiceIds: [],
      recentActivities: [
        { id: `ra-${Date.now()}`, message: "Cloned from existing recurring profile", by: "System", timestamp: new Date().toISOString() },
      ],
    };
    persist([cloned, ...profiles]);
    setSelectedId(cloned.id);
    toast.success("Recurring profile cloned");
  };

  const handleStop = () => {
    if (!selected) return;
    const next = profiles.map((entry) =>
      entry.id === selected.id
        ? {
            ...entry,
            status: "stopped" as const,
            recentActivities: [
              { id: `ra-${Date.now()}`, message: "Recurring profile stopped", by: "System", timestamp: new Date().toISOString() },
              ...entry.recentActivities,
            ],
          }
        : entry,
    );
    persist(next);
    toast.success("Recurring profile stopped");
  };

  const handleDelete = () => {
    if (!selected) return;
    const next = profiles.filter((entry) => entry.id !== selected.id);
    persist(next);
    setSelectedId(next[0]?.id || "");
    navigate("/sales/recurring-invoices", { replace: true });
    toast.success("Recurring profile deleted");
  };

  return (
    <div>
      <div className="space-y-4 p-6">
        {/* Top card */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">All Recurring Invoices</p>
              <p className="text-xl font-semibold">{profiles.length} Profiles</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New
            </Button>
          </CardContent>
        </Card>

        {/* Profiles table */}
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Invoice Date</TableHead>
                  <TableHead>Next Invoice Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow
                    key={profile.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedId(profile.id);
                      navigate(`/sales/recurring-invoices/${profile.id}/edit`);
                    }}
                  >
                    <TableCell>{profile.customerName}</TableCell>
                    <TableCell className="font-medium text-primary">{profile.profileName}</TableCell>
                    <TableCell>{frequencyLabel[profile.frequency]}</TableCell>
                    <TableCell>{profile.lastInvoiceDate}</TableCell>
                    <TableCell>{profile.nextInvoiceDate}</TableCell>
                    <TableCell>
                      <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                        {profile.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">Rs.{profile.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Selected profile detail */}
        {selected && (
          <Card>
            <CardContent className="pt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-4xl font-light">{selected.profileName}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={openEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleCreateChildInvoice}>
                    Create Invoice
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        More <MoreHorizontal className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          setConfirmState({
                            open: true,
                            title: "Stop Recurring Profile",
                            description: "Stop this recurring profile from generating future invoices?",
                            confirmLabel: "Stop",
                            tone: "default",
                            onConfirm: handleStop,
                          });
                        }}
                      >
                        Stop
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleClone}>Clone</DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          setConfirmState({
                            open: true,
                            title: "Delete Recurring Profile",
                            description: "Delete this recurring profile? This action cannot be undone.",
                            confirmLabel: "Delete",
                            tone: "destructive",
                            onConfirm: handleDelete,
                          });
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/sales/recurring-invoices", { replace: true })}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="next">Next Invoice</TabsTrigger>
                  <TabsTrigger value="activities">Recent Activities</TabsTrigger>
                </TabsList>

                {/* Overview tab */}
                <TabsContent value="overview" className="pt-4">
                  <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                    {/* Left sidebar */}
                    <div className="space-y-4 rounded-xl border bg-muted/20 p-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Details</p>
                        <p className="mt-2">
                          Profile Status: <b>{selected.status === "active" ? "Active" : "Stopped"}</b>
                        </p>
                        <p>Start Date: <b>{selected.startOn}</b></p>
                        <p>
                          End Date:{" "}
                          <b>{selected.neverExpires ? "Never Expires" : selected.endsOn || "-"}</b>
                        </p>
                        <p>Payment Terms: <b>{selected.paymentTerms}</b></p>
                        <p>Manually Created Invoices: <b>{profileInvoices.length}</b></p>
                      </div>
                      <div className="rounded-lg border bg-white p-3">
                        <p className="font-medium">Recurring Invoice preference has been set to</p>
                        <p className="text-muted-foreground">
                          "{selected.createAsDraft ? "Create Invoices as Drafts" : "Create and Send"}"
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Address</p>
                        <p className="mt-2 whitespace-pre-wrap">
                          Billing Address{"\n"}
                          {selected.billingAddress}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap">
                          Shipping Address{"\n"}
                          {selected.shippingAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Customer Notes</p>
                        <p className="mt-2 whitespace-pre-wrap">{selected.notes || "-"}</p>
                      </div>
                    </div>

                    {/* Right section */}
                    <div className="space-y-4">
                      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Invoice Amount</p>
                          <p className="text-3xl font-semibold">Rs.{selected.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next Invoice Date</p>
                          <p className="text-2xl font-semibold text-blue-600">{selected.nextInvoiceDate}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recurring Period</p>
                          <p className="text-2xl font-semibold">{frequencyLabel[selected.frequency]}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-lg font-semibold">All Child Invoices</p>
                          <p className="text-sm text-muted-foreground">
                            Unpaid Invoices: Rs.
                            {profileInvoices
                              .filter((entry) => entry.status !== "Paid")
                              .reduce((sum, entry) => sum + entry.grandTotal, 0)
                              .toFixed(2)}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {profileInvoices.length === 0 && (
                            <p className="text-sm text-muted-foreground">No child invoices created yet.</p>
                          )}
                          {profileInvoices.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                            >
                              <div>
                                <p className="font-medium">{entry.clientName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.invoiceNumber} | {entry.invoiceDate}
                                </p>
                                <p className="text-xs text-muted-foreground">{entry.status}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">Rs.{entry.grandTotal.toFixed(2)}</p>
                                <Button
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    navigate("/sales/payment-receipts/create", {
                                      state: {
                                        fromInvoiceId: entry.id,
                                        customerName: entry.clientName,
                                        invoiceNumber: entry.invoiceNumber,
                                        amount: entry.grandTotal,
                                        email: entry.clientContact || "",
                                      },
                                    })
                                  }
                                >
                                  Record Payment
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Next Invoice tab */}
                <TabsContent value="next" className="pt-4">
                  <div className="overflow-x-auto rounded-xl border bg-white p-2">
                    <NextInvoicePreview profile={selected} />
                  </div>
                </TabsContent>

                {/* Recent Activities tab */}
                <TabsContent value="activities" className="pt-4">
                  <div className="space-y-4">
                    {selected.recentActivities.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent activities.</p>
                    )}
                    {selected.recentActivities.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid gap-3 rounded-lg border p-4 md:grid-cols-[160px_minmax(0,1fr)]"
                      >
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleDateString()}
                          <br />
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                        <div>
                          <p className="font-medium">{entry.message}</p>
                          <p className="text-sm text-muted-foreground">by {entry.by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        {...confirmState}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((prev) => ({ ...prev, open: false }));
        }}
      />

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => (!open ? closeDialog() : setFormOpen(open))}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Recurring Invoice" : "New Recurring Invoice"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Customer Name */}
              <div>
                <Label>Customer Name*</Label>
                <Select
                  value={form.customerName}
                  onValueChange={(value) => {
                    const selectedClient = clients.find((c) => c.name === value);
                    const addr = selectedClient
                      ? [selectedClient.billingAddress, selectedClient.billingCity, selectedClient.billingState, selectedClient.billingPincode].filter(Boolean).join(", ")
                      : "";
                    setForm((cur) => ({
                      ...cur,
                      customerName: value,
                      customerEmail: selectedClient?.email || cur.customerEmail,
                      customerPhone: selectedClient?.phone || cur.customerPhone,
                      billingAddress: addr || cur.billingAddress,
                      shippingAddress: addr || cur.shippingAddress,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Name */}
              <div>
                <Label>Profile Name*</Label>
                <Input
                  value={form.profileName}
                  onChange={(e) => setForm((cur) => ({ ...cur, profileName: e.target.value }))}
                />
              </div>

              {/* Order Number */}
              <div>
                <Label>Order Number</Label>
                <Input
                  value={form.orderNumber}
                  onChange={(e) => setForm((cur) => ({ ...cur, orderNumber: e.target.value }))}
                />
              </div>

              {/* Frequency */}
              <div>
                <Label>Repeat Every*</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(value: Frequency) => setForm((cur) => ({ ...cur, frequency: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Week</SelectItem>
                    <SelectItem value="monthly">Month</SelectItem>
                    <SelectItem value="quarterly">Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start On */}
              <div>
                <Label>Start On</Label>
                <Input
                  type="date"
                  value={form.startOn}
                  onChange={(e) => setForm((cur) => ({ ...cur, startOn: e.target.value }))}
                />
              </div>

              {/* Ends On */}
              <div className="space-y-2">
                <Label>Ends On</Label>
                <Input
                  type="date"
                  value={form.endsOn}
                  disabled={form.neverExpires}
                  onChange={(e) => setForm((cur) => ({ ...cur, endsOn: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={form.neverExpires}
                    onCheckedChange={(checked) => setForm((cur) => ({ ...cur, neverExpires: !!checked }))}
                  />
                  Never Expires
                </label>
              </div>

              {/* Payment Terms */}
              <div>
                <Label>Payment Terms</Label>
                <Select
                  value={form.paymentTerms}
                  onValueChange={(value) => setForm((cur) => ({ ...cur, paymentTerms: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Place of Supply */}
              <div>
                <Label>Place of Supply</Label>
                <Input
                  value={form.placeOfSupply}
                  onChange={(e) => setForm((cur) => ({ ...cur, placeOfSupply: e.target.value }))}
                  placeholder="[KA] - Karnataka"
                />
              </div>
            </div>

            {/* Item Table */}
            <div className="rounded-xl border bg-white">
              <div className="border-b px-4 py-3">
                <p className="font-semibold">Item Table</p>
              </div>
              <div className="p-4">
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
                  <Input
                    placeholder="Type or click to select an item"
                    value={form.item.itemName}
                    onChange={(e) => setForm((cur) => ({ ...cur, item: { ...cur.item, itemName: e.target.value } }))}
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={form.item.quantity}
                    onChange={(e) => setForm((cur) => ({ ...cur, item: { ...cur.item, quantity: toNumber(e.target.value, 1) } }))}
                  />
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={form.item.rate}
                    onChange={(e) => setForm((cur) => ({ ...cur, item: { ...cur.item, rate: toNumber(e.target.value) } }))}
                  />
                  <Input
                    type="number"
                    placeholder="Discount"
                    value={form.item.discount}
                    onChange={(e) => setForm((cur) => ({ ...cur, item: { ...cur.item, discount: toNumber(e.target.value) } }))}
                  />
                  <Input
                    type="number"
                    placeholder="Tax %"
                    value={form.item.taxRate}
                    onChange={(e) => setForm((cur) => ({ ...cur, item: { ...cur.item, taxRate: toNumber(e.target.value) } }))}
                  />
                  <Input
                    value={lineAmount(form.item).toFixed(2)}
                    readOnly
                    className="bg-muted text-right"
                  />
                </div>
                <Input
                  className="mt-3"
                  placeholder="Description"
                  value={form.item.description}
                  onChange={(e) => setForm((cur) => ({ ...cur, item: { ...cur.item, description: e.target.value } }))}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              {/* Notes / T&C / preferences */}
              <div className="space-y-4">
                <div>
                  <Label>Customer Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Terms &amp; Conditions</Label>
                  <Textarea
                    value={form.termsAndConditions}
                    onChange={(e) => setForm((cur) => ({ ...cur, termsAndConditions: e.target.value }))}
                  />
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700">
                  Configure payment gateways and receive payments online. Set up Payment Gateway.
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={form.createAsDraft}
                    onCheckedChange={(checked) => setForm((cur) => ({ ...cur, createAsDraft: !!checked }))}
                  />
                  Preferences: Create Invoices as Drafts
                </label>
              </div>

              {/* Totals panel */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Sub Total</span>
                    <span>{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Shipping Charges</span>
                    <Input
                      className="w-28 text-right"
                      type="number"
                      value={form.shippingCharges}
                      onChange={(e) => setForm((cur) => ({ ...cur, shippingCharges: toNumber(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>TDS</span>
                    <Input
                      className="w-28 text-right"
                      type="number"
                      value={form.tds}
                      onChange={(e) => setForm((cur) => ({ ...cur, tds: toNumber(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Adjustment</span>
                    <Input
                      className="w-28 text-right"
                      type="number"
                      value={form.adjustment}
                      onChange={(e) => setForm((cur) => ({ ...cur, adjustment: toNumber(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Round Off</span>
                    <Input
                      className="w-28 text-right"
                      type="number"
                      value={form.roundOff}
                      onChange={(e) => setForm((cur) => ({ ...cur, roundOff: toNumber(e.target.value) }))}
                    />
                  </div>
                  <div className="border-t pt-3 text-base font-semibold">
                    <div className="flex items-center justify-between">
                      <span>Total (Rs)</span>
                      <span>{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={saveProfile}>{editingId ? "Update" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
