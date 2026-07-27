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
import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";

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

// Multi-line item (used in the form)
interface RecurringLineItem {
  id: string;
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
  item: RecurringItem;           // kept for backward-compat / preview
  items: RecurringLineItem[];    // new multi-row store
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

const lineAmount = (item: RecurringItem | RecurringLineItem) =>
  Math.max(0, item.quantity * item.rate - item.discount);

const blankLineItem = (): RecurringLineItem => ({
  id: `rli-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  itemName: "",
  description: "",
  hsnSac: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  taxRate: 18,
});

// Compute totals from an array of line items
const computeTotalsFromItems = (
  items: RecurringLineItem[],
  shippingCharges: number,
  adjustment: number,
  tds: number,
  roundOff: number,
) => {
  const grossSubtotal = items.reduce((s, it) => s + it.quantity * it.rate, 0);
  const totalDiscount = items.reduce((s, it) => s + it.discount, 0);
  const subtotal = Math.max(0, grossSubtotal - totalDiscount);

  // GST slabs grouped by rate
  const slabMap: Record<number, { taxable: number; cgst: number; sgst: number }> = {};
  for (const it of items) {
    const taxable = Math.max(0, it.quantity * it.rate - it.discount);
    const rate = it.taxRate;
    if (!slabMap[rate]) slabMap[rate] = { taxable: 0, cgst: 0, sgst: 0 };
    slabMap[rate].taxable += taxable;
    slabMap[rate].cgst += taxable * (rate / 2) / 100;
    slabMap[rate].sgst += taxable * (rate / 2) / 100;
  }
  const gstSlabs = Object.entries(slabMap)
    .filter(([, v]) => v.taxable > 0)
    .map(([rate, v]) => ({ rate: Number(rate), ...v }))
    .sort((a, b) => a.rate - b.rate);

  const totalTax = gstSlabs.reduce((s, sl) => s + sl.cgst + sl.sgst, 0);
  const total = subtotal + totalTax + shippingCharges + adjustment - tds + roundOff;

  return {
    grossSubtotal: Math.round(grossSubtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    gstSlabs,
    totalTax: Math.round(totalTax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// Legacy single-item helper kept for profile backward compat
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
  items: [
    {
      id: "rli-default-1",
      itemName: "3D Design Model",
      description: "3D Model Mould Designs for Handel.",
      hsnSac: "9983",
      quantity: 1,
      rate: 400,
      discount: 0,
      taxRate: 18,
    },
  ],
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

  // Migrate from old single `item` to `items` array
  let items: RecurringLineItem[];
  if (Array.isArray(raw.items) && raw.items.length > 0) {
    items = raw.items.map((it) => ({
      id: it.id || `rli-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      itemName: it.itemName || "",
      description: it.description || "",
      hsnSac: it.hsnSac || "",
      quantity: toNumber(it.quantity, 1),
      rate: toNumber(it.rate, 0),
      discount: toNumber(it.discount, 0),
      taxRate: toNumber(it.taxRate, 18),
    }));
  } else {
    items = [{
      id: `rli-migrated-${Date.now()}`,
      itemName: item.itemName,
      description: item.description,
      hsnSac: item.hsnSac,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount,
      taxRate: item.taxRate,
    }];
  }

  const shippingCharges = toNumber(raw.shippingCharges, 0);
  const adjustment = toNumber(raw.adjustment, 0);
  const tds = toNumber(raw.tds, 0);
  const roundOff = toNumber(raw.roundOff, 0);
  const totals = computeTotals(item, shippingCharges, adjustment, tds, roundOff);

  return {
    ...defaultProfile,
    ...raw,
    item,
    items,
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
  items: [blankLineItem()],
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
    () => computeTotalsFromItems(
      (form.items && form.items.length > 0) ? form.items : [{ ...form.item, id: "tmp" }],
      toNumber(form.shippingCharges),
      toNumber(form.adjustment),
      toNumber(form.tds),
      toNumber(form.roundOff),
    ),
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

    const activeItems = (form.items && form.items.length > 0) ? form.items : [{ ...form.item, id: "tmp" }];
    const nextInvoiceDate = addByFrequency(form.startOn, form.frequency);
    const computed = computeTotalsFromItems(activeItems, form.shippingCharges, form.adjustment, form.tds, form.roundOff);
    // Sync legacy `item` field from first row
    const firstItem = activeItems[0];
    const syncedItem: RecurringItem = {
      itemName: firstItem.itemName,
      description: firstItem.description,
      hsnSac: firstItem.hsnSac,
      quantity: firstItem.quantity,
      rate: firstItem.rate,
      discount: firstItem.discount,
      taxRate: firstItem.taxRate,
    };

    if (editingId) {
      const next = profiles.map((entry) =>
        entry.id === editingId
          ? { ...entry, ...form, item: syncedItem, items: activeItems, amount: computed.total, nextInvoiceDate }
          : entry,
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
      item: syncedItem,
      items: activeItems,
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

    const activeItems = (selected.items && selected.items.length > 0) ? selected.items : [{ ...selected.item, id: "tmp" }];
    const ct = computeTotalsFromItems(activeItems, selected.shippingCharges, selected.adjustment, selected.tds, selected.roundOff);
    const grandTotal = Math.round(ct.total * 100) / 100;

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
      lineItems: activeItems.map((it, idx) => ({
        id: `rli-${Date.now()}-${idx}`,
        description: it.itemName,
        itemDetails: it.description,
        hsnSac: it.hsnSac,
        quantity: it.quantity,
        rate: it.rate,
        discount: it.discount,
        taxPercent: it.taxRate,
        taxType: "CGST+SGST" as const,
      })),
      grossSubtotal: ct.grossSubtotal,
      totalDiscount: ct.totalDiscount,
      subtotal: ct.subtotal,
      totalTax: ct.totalTax,
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
    <>
    <div className="p-6 space-y-4">
      {/* Top card */}
      <div className="rounded-xl border bg-white px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">All Recurring Invoices</p>
          <p className="text-2xl font-bold leading-tight">{profiles.length} Profiles</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Profiles table */}
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Customer</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Profile Name</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Frequency</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Last Invoice Date</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Next Invoice Date</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-right">Amount</TableHead>
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
                <TableCell className="text-sm">{profile.customerName}</TableCell>
                <TableCell className="text-sm font-medium text-blue-600">{profile.profileName}</TableCell>
                <TableCell className="text-sm">{frequencyLabel[profile.frequency]}</TableCell>
                <TableCell className="text-sm">{profile.lastInvoiceDate}</TableCell>
                <TableCell className="text-sm">{profile.nextInvoiceDate}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      profile.status === "active"
                        ? "bg-blue-600 text-white border-transparent hover:bg-blue-700 text-[11px] px-3 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                        : "bg-gray-100 text-gray-500 border-transparent text-[11px] px-3 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    }
                  >
                    {profile.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-right">Rs.{profile.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Selected profile detail — borderless, flat */}
      {selected && (
        <div className="rounded-xl border bg-white">
          {/* Header row */}
          <div className="px-6 pt-6 pb-0 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-5xl font-light tracking-tight">{selected.profileName}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={openEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleCreateChildInvoice}>
                Create Invoice
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    More <MoreHorizontal className="h-4 w-4" />
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

          {/* Tabs */}
          <div className="px-6 pt-4">
            <Tabs defaultValue="overview">
              <TabsList className="bg-transparent border-0 p-0 h-auto gap-0">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="next"
                  className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  Next Invoice
                </TabsTrigger>
                <TabsTrigger
                  value="activities"
                  className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  Recent Activities
                </TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="pt-4 pb-6">
                <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                  {/* Left sidebar */}
                  <div className="space-y-4 rounded-xl border bg-gray-50 p-4 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-2">Details</p>
                      <p>Profile Status: <b>{selected.status === "active" ? "Active" : "Stopped"}</b></p>
                      <p>Start Date: <b>{selected.startOn}</b></p>
                      <p>End Date: <b>{selected.neverExpires ? "Never Expires" : selected.endsOn || "-"}</b></p>
                      <p>Payment Terms: <b>{selected.paymentTerms}</b></p>
                      <p>Manually Created Invoices: <b>{profileInvoices.length}</b></p>
                    </div>
                    <div className="rounded-lg border bg-white p-3 text-sm">
                      <p className="font-medium leading-snug">Recurring Invoice preference has been set to</p>
                      <p className="text-muted-foreground mt-0.5">"{selected.createAsDraft ? "Create Invoices as Drafts" : "Create and Send"}"</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-2">Address</p>
                      <p className="text-xs text-muted-foreground mb-0.5">Billing Address</p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{selected.billingAddress}</p>
                      <p className="text-xs text-muted-foreground mt-3 mb-0.5">Shipping Address</p>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{selected.shippingAddress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-2">Customer Notes</p>
                      <p className="whitespace-pre-wrap text-xs">{selected.notes || "-"}</p>
                    </div>
                  </div>

                  {/* Right section */}
                  <div className="space-y-4">
                    {/* 3 stat cards */}
                    <div className="grid gap-0 rounded-xl border bg-white divide-x md:grid-cols-3 overflow-hidden">
                      <div className="p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">Invoice Amount</p>
                        <p className="text-3xl font-semibold">Rs.{selected.amount.toFixed(2)}</p>
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">Next Invoice Date</p>
                        <p className="text-2xl font-semibold text-blue-600">{selected.nextInvoiceDate}</p>
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">Recurring Period</p>
                        <p className="text-2xl font-semibold">{frequencyLabel[selected.frequency]}</p>
                      </div>
                    </div>

                    {/* Child invoices */}
                    <div className="rounded-xl border bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-base font-semibold">All Child Invoices</p>
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
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                          >
                            <div>
                              <p className="font-medium text-sm">{entry.clientName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {entry.invoiceNumber} | {entry.invoiceDate}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{entry.status}</p>
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
              <TabsContent value="next" className="pt-4 pb-6">
                <div className="overflow-x-auto rounded-xl border bg-white p-2">
                  <NextInvoicePreview profile={selected} />
                </div>
              </TabsContent>

              {/* Recent Activities tab */}
              <TabsContent value="activities" className="pt-4 pb-6">
                <div className="space-y-3">
                  {selected.recentActivities.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activities.</p>
                  )}
                  {selected.recentActivities.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[160px_minmax(0,1fr)]"
                    >
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                        <br />
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">by {entry.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
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
        <DialogContent className="max-h-[96vh] w-[95vw] max-w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Recurring Invoice" : "New Recurring Invoice"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">

            {/* ── Section 1: Profile & Schedule ── */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Profile &amp; Schedule</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Customer Name */}
                <div className="lg:col-span-2">
                  <Label>Customer Name *</Label>
                  <Select
                    value={form.customerName}
                    onValueChange={(value) => {
                      const cl = clients.find((c) => c.name === value);
                      const addr = cl
                        ? [cl.billingAddress, cl.billingCity, cl.billingState, cl.billingPincode]
                            .filter(Boolean).join(", ")
                        : "";
                      setForm((cur) => ({
                        ...cur,
                        customerName: value,
                        customerEmail:  cl?.email       || cur.customerEmail,
                        customerPhone:  cl?.phone || cl?.mobile || cur.customerPhone,
                        customerGstin:  cl?.gstin       || cur.customerGstin,
                        customerPan:    cl?.pan_number  || cur.customerPan,
                        placeOfSupply:  cl?.billingState ? `${cl.billingState}` : cur.placeOfSupply,
                        billingAddress:  addr || cur.billingAddress,
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
                <div className="lg:col-span-2">
                  <Label>Profile Name *</Label>
                  <Input
                    value={form.profileName}
                    onChange={(e) => setForm((cur) => ({ ...cur, profileName: e.target.value }))}
                    placeholder="e.g. Monthly Maintenance"
                  />
                </div>

                {/* Auto-filled customer details (read-only display) */}
                {(form.customerEmail || form.customerPhone || form.customerGstin || form.customerPan) && (
                  <div className="lg:col-span-4 rounded-lg border bg-blue-50/60 px-4 py-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 md:grid-cols-4 text-xs">
                    {form.customerEmail && <p><span className="text-muted-foreground">Email:</span> <b>{form.customerEmail}</b></p>}
                    {form.customerPhone && <p><span className="text-muted-foreground">Phone:</span> <b>{form.customerPhone}</b></p>}
                    {form.customerGstin && <p><span className="text-muted-foreground">GSTIN:</span> <b>{form.customerGstin}</b></p>}
                    {form.customerPan   && <p><span className="text-muted-foreground">PAN:</span> <b>{form.customerPan}</b></p>}
                  </div>
                )}

                {/* Repeat Every */}
                <div>
                  <Label>Repeat Every *</Label>
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
                <div className="space-y-1.5">
                  <Label>Ends On</Label>
                  <Input
                    type="date"
                    value={form.endsOn}
                    disabled={form.neverExpires}
                    onChange={(e) => setForm((cur) => ({ ...cur, endsOn: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
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
                    placeholder="e.g. Karnataka (29)"
                  />
                </div>

                {/* Order Number */}
                <div>
                  <Label>Order Number</Label>
                  <Input
                    value={form.orderNumber}
                    onChange={(e) => setForm((cur) => ({ ...cur, orderNumber: e.target.value }))}
                    placeholder="PO / Reference number"
                  />
                </div>

                {/* Billing Address */}
                <div className="lg:col-span-2">
                  <Label>Billing Address</Label>
                  <Textarea
                    rows={3}
                    value={form.billingAddress}
                    onChange={(e) => setForm((cur) => ({ ...cur, billingAddress: e.target.value }))}
                    placeholder="Full billing address"
                  />
                </div>

                {/* Shipping Address */}
                <div className="lg:col-span-2">
                  <Label>Shipping Address</Label>
                  <Textarea
                    rows={3}
                    value={form.shippingAddress}
                    onChange={(e) => setForm((cur) => ({ ...cur, shippingAddress: e.target.value }))}
                    placeholder="Leave blank to use billing address"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Item Table ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Item Details</p>
                <button
                  type="button"
                  onClick={() => setForm((cur) => ({ ...cur, items: [...(cur.items || []), blankLineItem()] }))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["#", "ITEM / DESCRIPTION", "HSN/SAC", "QTY", "RATE (₹)", "DISC (₹)", "TAXABLE (₹)", "GST %", "GST (₹)", "AMOUNT (₹)", ""].map((h) => (
                        <th key={h} className="px-2 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items && form.items.length > 0 ? form.items : []).map((it, idx) => {
                      const disc    = it.discount ?? 0;
                      const taxable = Math.max(0, it.quantity * it.rate - disc);
                      const gst     = taxable * (it.taxRate / 100);
                      const amt     = taxable + gst;
                      const updateLineItem = <K extends keyof RecurringLineItem>(id: string, field: K, value: RecurringLineItem[K]) => {
                        setForm((cur) => ({
                          ...cur,
                          items: (cur.items || []).map((li) => li.id === id ? { ...li, [field]: value } : li),
                        }));
                      };
                      return (
                        <tr key={it.id} className="border-b border-gray-100 hover:bg-gray-50/50 align-top">
                          {/* # */}
                          <td className="px-2 py-2 text-xs text-gray-400 text-center pt-3">{idx + 1}</td>
                          {/* Item / Description */}
                          <td className="px-2 py-2 min-w-[200px]">
                            <input
                              value={it.itemName}
                              onChange={(e) => updateLineItem(it.id, "itemName", e.target.value)}
                              placeholder="Item name"
                              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              value={it.description}
                              onChange={(e) => updateLineItem(it.id, "description", e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </td>
                          {/* HSN/SAC */}
                          <td className="px-2 py-2">
                            <input
                              value={it.hsnSac}
                              onChange={(e) => updateLineItem(it.id, "hsnSac", e.target.value)}
                              placeholder="HSN/SAC"
                              className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          {/* Qty */}
                          <td className="px-2 py-2">
                            <input
                              type="number" min={1} value={it.quantity}
                              onChange={(e) => updateLineItem(it.id, "quantity", Math.max(1, toNumber(e.target.value, 1)))}
                              className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          {/* Rate */}
                          <td className="px-2 py-2">
                            <input
                              type="number" min={0} value={it.rate}
                              onChange={(e) => updateLineItem(it.id, "rate", toNumber(e.target.value))}
                              className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          {/* Discount */}
                          <td className="px-2 py-2">
                            <input
                              type="number" min={0} value={it.discount}
                              onChange={(e) => updateLineItem(it.id, "discount", toNumber(e.target.value))}
                              className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          {/* Taxable */}
                          <td className="px-2 py-2 text-sm text-gray-700 text-right whitespace-nowrap pt-3 font-medium">
                            {taxable.toFixed(2)}
                          </td>
                          {/* GST % */}
                          <td className="px-2 py-2">
                            <input
                              type="number" min={0} max={100} value={it.taxRate}
                              onChange={(e) => updateLineItem(it.id, "taxRate", toNumber(e.target.value))}
                              className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          {/* GST ₹ */}
                          <td className="px-2 py-2 text-sm text-gray-700 text-right whitespace-nowrap pt-3">
                            {gst.toFixed(2)}
                          </td>
                          {/* Amount */}
                          <td className="px-2 py-2 text-sm font-semibold text-gray-900 text-right whitespace-nowrap pt-3">
                            {amt.toFixed(2)}
                          </td>
                          {/* Delete */}
                          <td className="px-2 py-2 text-center pt-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setForm((cur) => ({
                                  ...cur,
                                  items: cur.items.length === 1 ? cur.items : cur.items.filter((li) => li.id !== it.id),
                                }))
                              }
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Section 3: Summary + Notes ── */}
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left: Notes / T&C / preferences */}
              <div className="space-y-4">
                <div>
                  <Label>Customer Notes</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                    placeholder="Notes visible on the invoice..."
                  />
                </div>
                <div>
                  <Label>Terms &amp; Conditions</Label>
                  <Textarea
                    rows={3}
                    value={form.termsAndConditions}
                    onChange={(e) => setForm((cur) => ({ ...cur, termsAndConditions: e.target.value }))}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={form.createAsDraft}
                    onCheckedChange={(checked) => setForm((cur) => ({ ...cur, createAsDraft: !!checked }))}
                  />
                  Preferences: Create Invoices as Drafts
                </label>
              </div>

              {/* Right: Totals panel */}
              <div className="rounded-xl border bg-white overflow-hidden text-sm">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-600">Gross Subtotal</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">₹ {totals.grossSubtotal.toFixed(2)}</td>
                    </tr>
                    {totals.totalDiscount > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-2.5 text-gray-600">Item Level Discounts (−)</td>
                        <td className="px-4 py-2.5 text-right text-red-600">− ₹ {totals.totalDiscount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 font-semibold text-gray-900">Total Taxable Value</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">₹ {totals.subtotal.toFixed(2)}</td>
                    </tr>

                    {/* GST slab rows */}
                    {totals.gstSlabs.map((sl) => (
                      <>
                        <tr key={`cgst-${sl.rate}`} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-500">CGST @ {sl.rate / 2}%</td>
                          <td className="px-4 py-2 text-right text-gray-700">₹ {sl.cgst.toFixed(2)}</td>
                        </tr>
                        <tr key={`sgst-${sl.rate}`} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-500">SGST @ {sl.rate / 2}%</td>
                          <td className="px-4 py-2 text-right text-gray-700">₹ {sl.sgst.toFixed(2)}</td>
                        </tr>
                      </>
                    ))}
                    {totals.gstSlabs.length === 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-2 text-gray-500">Total GST</td>
                        <td className="px-4 py-2 text-right text-gray-700">₹ 0.00</td>
                      </tr>
                    )}

                    {/* Shipping */}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Shipping &amp; Handling</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number" min={0}
                          value={form.shippingCharges}
                          onChange={(e) => setForm((cur) => ({ ...cur, shippingCharges: toNumber(e.target.value) }))}
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>

                    {/* TDS */}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-600">TDS (−)</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number" min={0}
                          value={form.tds}
                          onChange={(e) => setForm((cur) => ({ ...cur, tds: toNumber(e.target.value) }))}
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>

                    {/* Adjustment */}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Adjustment</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={form.adjustment}
                          onChange={(e) => setForm((cur) => ({ ...cur, adjustment: toNumber(e.target.value) }))}
                          placeholder="e.g. -0.50"
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>

                    {/* Round Off */}
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Round Off</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={form.roundOff}
                          onChange={(e) => setForm((cur) => ({ ...cur, roundOff: toNumber(e.target.value) }))}
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>

                    {/* Grand Total */}
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900 text-base">Total Payable (₹)</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">₹ {totals.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={saveProfile}>{editingId ? "Update" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
