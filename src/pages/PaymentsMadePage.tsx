import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { safeReadJson } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ArrowLeft,
  Ellipsis,
  Mail,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type BillStatus = "DRAFT" | "OPEN" | "PAID";

interface BillItem {
  id: string;
  itemDetails: string;
  account: string;
  quantity: number;
  rate: number;
  discount: number;
  taxPercent: number;
  customerName: string;
}

interface BillEntry {
  id: string;
  billNumber: string;
  referenceNumber: string;
  vendorName: string;
  vendorAddress?: string;
  billDate: string;
  dueDate: string;
  paymentTerms?: string;
  status: BillStatus;
  paymentMade: number;
  adjustment: number;
  items: BillItem[];
}

interface PaymentAllocation {
  billId: string;
  amount: number;
}

interface PaymentEntry {
  id: string;
  date: string;
  paymentNumber: string;
  referenceNumber: string;
  vendorName: string;
  billNumber: string;
  billId?: string;
  mode: string;
  status: "PAID" | "DRAFT";
  amount: number;
  unusedAmount: number;
  paidThrough: string;
  notes: string;
  allocations: PaymentAllocation[];
  type: "Bill Payment" | "Vendor Advance";
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BILLS_STORAGE_KEY = "nido_purchase_bills_v1";
const PAYMENTS_STORAGE_KEY = "nido_purchase_payments_made_v1";

// ── Helpers ───────────────────────────────────────────────────────────────────
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);

const toNumber = (value: string | number, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const billTotal = (bill: Pick<BillEntry, "items" | "adjustment">) => {
  const subtotal = bill.items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const disc = (base * item.discount) / 100;
    return sum + (base - disc);
  }, 0);
  const tax = bill.items.reduce((sum, item) => {
    const base = item.quantity * item.rate;
    const disc = (base * item.discount) / 100;
    return sum + ((base - disc) * item.taxPercent) / 100;
  }, 0);
  return subtotal + tax + (bill.adjustment ?? 0);
};

const nextPaymentNumber = (entries: PaymentEntry[]) => {
  const max = entries.reduce((cur, e) => {
    const n = Number(e.paymentNumber.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(cur, n) : cur;
  }, 0);
  return `PAY-${String(max + 1).padStart(5, "0")}`;
};

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Payment Voucher (printable) ───────────────────────────────────────────────
function PaymentVoucher({ entry }: { entry: PaymentEntry }) {
  return (
    <div className="mx-auto max-w-[820px] space-y-6 bg-white p-8 text-gray-900 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">PAYMENTS MADE</h3>
          <p className="text-sm text-gray-500 mt-0.5">Payment #{entry.paymentNumber}</p>
        </div>
        <div className="rounded-lg bg-emerald-600 px-5 py-3 text-right text-white">
          <p className="text-xs uppercase tracking-wider font-medium opacity-80">Amount Paid</p>
          <p className="text-2xl font-bold mt-0.5">{money(entry.amount)}</p>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Details grid */}
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Paid To</p>
          <p className="font-medium text-gray-800">{entry.vendorName || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Date</p>
          <p className="font-medium text-gray-800">{entry.date}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Mode</p>
          <p className="font-medium text-gray-800">{entry.mode}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Paid Through</p>
          <p className="font-medium text-gray-800">{entry.paidThrough}</p>
        </div>
        {entry.referenceNumber && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reference #</p>
            <p className="font-medium text-gray-800">{entry.referenceNumber}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</p>
          <p className="font-medium text-gray-800">{entry.type}</p>
        </div>
      </div>

      {/* Allocation table */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment For</p>
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Bill #</th>
              <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Reference</th>
              <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Payment Amount</th>
            </tr>
          </thead>
          <tbody>
            {entry.allocations.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-400 text-sm">
                  Advance payment — no bill linked
                </td>
              </tr>
            ) : (
              entry.allocations.map((alloc) => (
                <tr key={alloc.billId} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 text-gray-700">{entry.billNumber || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-700">{entry.referenceNumber || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-900">{money(alloc.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="w-64 border border-gray-200 rounded-lg overflow-hidden text-sm">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2.5 text-gray-600">Amount Paid</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{money(entry.amount)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2.5 text-gray-600">Used for Payments</td>
                <td className="px-4 py-2.5 text-right text-gray-900">
                  {money(entry.allocations.reduce((s, a) => s + a.amount, 0))}
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-4 py-3 font-bold text-gray-900">Unused Amount</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{money(entry.unusedAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {entry.notes && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-gray-600">{entry.notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentsMadePage() {
  const { setMeta } = usePageMeta();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const { vendors = [] } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  const routeState = (location.state || {}) as { vendorName?: string };
  const detailId = params.id;
  const isCreateMode = location.pathname.endsWith("/create");

  const [payments, setPayments] = useState<PaymentEntry[]>(() =>
    safeReadJson<PaymentEntry[]>(PAYMENTS_STORAGE_KEY, [])
  );
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(isCreateMode);
  const [tab, setTab] = useState<"Bill Payment" | "Vendor Advance">("Bill Payment");

  const [form, setForm] = useState({
    vendorName: routeState.vendorName || "",
    paymentNumber: "",
    paymentMode: "Cash",
    paidThrough: "Petty Cash",
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: "",
    notes: "",
    amountReceived: "",
  });
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  // Sync payment number when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setForm((f) => ({ ...f, paymentNumber: nextPaymentNumber(payments) }));
    }
  }, [dialogOpen]);

  useEffect(() => {
    const title = detailId
      ? payments.find((p) => p.id === detailId)?.paymentNumber || "Payment"
      : "Payments Made";
    setMeta({ title });
  }, [detailId, payments]);

  // Open dialog when navigating to /create
  useEffect(() => {
    if (isCreateMode) setDialogOpen(true);
  }, [isCreateMode]);

  const selectedPayment = useMemo(
    () => payments.find((p) => p.id === detailId) || null,
    [payments, detailId]
  );

  const bills = useMemo(
    () => safeReadJson<BillEntry[]>(BILLS_STORAGE_KEY, []),
    [payments, dialogOpen]
  );

  const vendorBills = useMemo(() => {
    if (!form.vendorName) return [] as BillEntry[];
    return bills.filter(
      (b) => b.vendorName === form.vendorName && b.status !== "PAID"
    );
  }, [bills, form.vendorName]);

  const vendorBillStats = useMemo(
    () =>
      vendorBills.map((bill) => {
        const total = billTotal(bill);
        const due = Math.max(total - bill.paymentMade, 0);
        return { bill, total, due };
      }),
    [vendorBills]
  );

  const totalApplied = useMemo(
    () => Object.values(allocations).reduce((s, v) => s + toNumber(v), 0),
    [allocations]
  );

  const amountValue = toNumber(form.amountReceived);
  const unusedAmount = Math.max(amountValue - totalApplied, 0);

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.paymentNumber.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.billNumber.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedPayment
      ? `Payment-${selectedPayment.paymentNumber}`
      : "Payment",
  });

  const persist = (next: PaymentEntry[]) => {
    setPayments(next);
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(next));
  };

  const updateBillsForPayment = (payment: PaymentEntry) => {
    if (!payment.allocations.length) return;
    const latestBills = safeReadJson<BillEntry[]>(BILLS_STORAGE_KEY, []);
    const updated = latestBills.map((bill) => {
      const alloc = payment.allocations.find((a) => a.billId === bill.id);
      if (!alloc) return bill;
      const total = billTotal(bill);
      const nextMade = bill.paymentMade + alloc.amount;
      return {
        ...bill,
        paymentMade: nextMade,
        status: (nextMade >= total ? "PAID" : "OPEN") as BillStatus,
      };
    });
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(updated));
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm({
      vendorName: "",
      paymentNumber: "",
      paymentMode: "Cash",
      paidThrough: "Petty Cash",
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceNumber: "",
      notes: "",
      amountReceived: "",
    });
    setAllocations({});
    setTab("Bill Payment");
    if (isCreateMode)
      navigate("/transactions/purchase/payments-made", { replace: true });
  };

  const savePayment = (status: "PAID" | "DRAFT") => {
    if (!form.vendorName.trim()) {
      toast({ title: "Vendor is required" });
      return;
    }
    if (amountValue <= 0) {
      toast({ title: "Enter a payment amount" });
      return;
    }

    const normalizedAllocs = Object.entries(allocations)
      .map(([billId, val]) => ({ billId, amount: toNumber(val) }))
      .filter((a) => a.amount > 0);

    const firstBill = bills.find((b) => b.id === normalizedAllocs[0]?.billId);

    const created: PaymentEntry = {
      id: `pm-${Date.now()}`,
      date: form.paymentDate,
      paymentNumber: form.paymentNumber || nextPaymentNumber(payments),
      referenceNumber: form.referenceNumber,
      vendorName: form.vendorName,
      billNumber: firstBill?.billNumber || "—",
      billId: firstBill?.id,
      mode: form.paymentMode,
      status,
      amount: amountValue,
      unusedAmount,
      paidThrough: form.paidThrough,
      notes: form.notes,
      allocations: normalizedAllocs,
      type: tab,
    };

    const next = [created, ...payments];
    persist(next);
    if (status === "PAID") updateBillsForPayment(created);

    toast({
      title: status === "PAID" ? "Payment recorded" : "Draft saved",
    });
    closeDialog();
    navigate(`/transactions/purchase/payments-made/${created.id}`, {
      replace: true,
    });
  };

  const deletePayment = (id: string) => {
    persist(payments.filter((p) => p.id !== id));
    toast({ title: "Payment deleted" });
    navigate("/transactions/purchase/payments-made", { replace: true });
  };

  const payInFull = (billId: string, due: number) => {
    setAllocations((curr) => ({ ...curr, [billId]: String(due.toFixed(2)) }));
  };

  const setF = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (detailId && selectedPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full space-y-5 p-6">
          {/* Toolbar */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      navigate("/transactions/purchase/payments-made")
                    }
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-1"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handlePrint()}>
                        <Printer className="mr-2 h-4 w-4" /> Print / PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          toast({ title: "Email sent to vendor" })
                        }
                      >
                        <Mail className="mr-2 h-4 w-4" /> Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => deletePayment(selectedPayment.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <button
                  onClick={() =>
                    navigate("/transactions/purchase/payments-made")
                  }
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Meta strip */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Payment #</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedPayment.paymentNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Vendor</p>
                    <p className="font-medium text-gray-800">{selectedPayment.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Date</p>
                    <p className="font-medium text-gray-800">{selectedPayment.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Mode</p>
                    <p className="font-medium text-gray-800">{selectedPayment.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Status</p>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${STATUS_STYLE[selectedPayment.status]}`}
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                    <p className="font-bold text-emerald-700">{money(selectedPayment.amount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voucher */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div ref={printRef}>
                <PaymentVoucher entry={selectedPayment} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full space-y-5 p-6">
        {/* Header */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Payments Made</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {payments.length} payment{payments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            placeholder="Search by payment #, vendor, bill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/70">
                  <TableHead className="pl-4 w-8">
                    <Checkbox checked={false} />
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">Date</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment #</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reference #</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vendor Name</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bill #</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mode</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Amount</TableHead>
                  <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Unused Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-16 text-gray-400"
                    >
                      {payments.length === 0
                        ? "No payments recorded yet. Click New to add one."
                        : "No payments match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        navigate(
                          `/transactions/purchase/payments-made/${entry.id}`
                        )
                      }
                    >
                      <TableCell
                        className="pl-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox checked={false} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5 whitespace-nowrap">
                        {entry.date}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm font-semibold text-blue-600 hover:underline">
                          {entry.paymentNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5">
                        {entry.referenceNumber || "—"}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-emerald-600">
                            {(entry.vendorName?.[0] ?? "V").toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {entry.vendorName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5">
                        {entry.billNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5">
                        {entry.mode}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${STATUS_STYLE[entry.status]}`}
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-800 py-3.5 text-right whitespace-nowrap">
                        {money(entry.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5 text-right whitespace-nowrap">
                        {money(entry.unusedAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── New Payment Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">New Payment Made</DialogTitle>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "Bill Payment" | "Vendor Advance")}
          >
            <TabsList className="mb-2">
              <TabsTrigger value="Bill Payment">Bill Payment</TabsTrigger>
              <TabsTrigger value="Vendor Advance">Vendor Advance</TabsTrigger>
            </TabsList>

            {/* ── Bill Payment Tab ─────────────────────────────────────── */}
            <TabsContent value="Bill Payment" className="space-y-5 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Vendor */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Vendor Name <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={form.vendorName}
                    onValueChange={(v) => {
                      setF("vendorName", v);
                      setAllocations({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.name}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment # */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment # <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={form.paymentNumber}
                    onChange={(e) => setF("paymentNumber", e.target.value)}
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Made (₹) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={form.amountReceived}
                    onChange={(e) => setF("amountReceived", e.target.value)}
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Date <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setF("paymentDate", e.target.value)}
                  />
                </div>

                {/* Mode */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Mode
                  </Label>
                  <Select
                    value={form.paymentMode}
                    onValueChange={(v) => setF("paymentMode", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Paid Through */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Paid Through <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={form.paidThrough}
                    onChange={(e) => setF("paidThrough", e.target.value)}
                  />
                </div>

                {/* Reference */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Reference #
                  </Label>
                  <Input
                    value={form.referenceNumber}
                    onChange={(e) => setF("referenceNumber", e.target.value)}
                  />
                </div>
              </div>

              {/* Bill allocation table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="border-b border-gray-100 px-4 py-2.5 flex items-center justify-between bg-gray-50/60">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Outstanding Bills
                  </p>
                  {Object.keys(allocations).length > 0 && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setAllocations({})}
                    >
                      Clear Applied Amount
                    </button>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</TableHead>
                      <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bill #</TableHead>
                      <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Bill Amount</TableHead>
                      <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Amount Due</TableHead>
                      <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment Date</TableHead>
                      <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorBillStats.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-400 text-sm"
                        >
                          {form.vendorName
                            ? "No open bills found for this vendor"
                            : "Select a vendor to see their open bills"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendorBillStats.map(({ bill, total, due }) => (
                        <TableRow key={bill.id} className="border-gray-100">
                          <TableCell className="text-sm text-gray-600 py-3">
                            {bill.billDate}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-blue-600 py-3">
                            {bill.billNumber}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-3 text-right">
                            {total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-gray-800 py-3 text-right">
                            {due.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-3">
                            {form.paymentDate}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                className="w-24 text-right h-8 text-sm"
                                placeholder="0.00"
                                value={allocations[bill.id] || ""}
                                onChange={(e) =>
                                  setAllocations((curr) => ({
                                    ...curr,
                                    [bill.id]: e.target.value,
                                  }))
                                }
                              />
                              <button
                                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                onClick={() => payInFull(bill.id, due)}
                              >
                                Pay in Full
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Summary strip */}
                <div className="border-t border-gray-100 bg-amber-50/50 p-4">
                  <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Amount Entered:</span>
                      <span className="font-medium">{money(amountValue)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Used for Payments:</span>
                      <span className="font-medium">{money(totalApplied)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-amber-200">
                      <span>Unused Amount:</span>
                      <span>{money(unusedAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Notes
                </Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setF("notes", e.target.value)}
                  placeholder="Add a note to this payment…"
                />
              </div>
            </TabsContent>

            {/* ── Vendor Advance Tab ───────────────────────────────────── */}
            <TabsContent value="Vendor Advance" className="space-y-5 pt-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm text-blue-700">
                This payment will be recorded as a vendor advance and can be applied against future bills.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Vendor Name <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={form.vendorName}
                    onValueChange={(v) => setF("vendorName", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.name}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment # <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={form.paymentNumber}
                    onChange={(e) => setF("paymentNumber", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Made (₹) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={form.amountReceived}
                    onChange={(e) => setF("amountReceived", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Date <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setF("paymentDate", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Mode
                  </Label>
                  <Select
                    value={form.paymentMode}
                    onValueChange={(v) => setF("paymentMode", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Paid Through
                  </Label>
                  <Input
                    value={form.paidThrough}
                    onChange={(e) => setF("paidThrough", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Reference #
                  </Label>
                  <Input
                    value={form.referenceNumber}
                    onChange={(e) => setF("referenceNumber", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Notes
                  </Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setF("notes", e.target.value)}
                    placeholder="Add a note…"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Dialog footer */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => savePayment("PAID")}
            >
              Save as Paid
            </Button>
            <Button variant="outline" onClick={() => savePayment("DRAFT")}>
              Save as Draft
            </Button>
            <Button variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
