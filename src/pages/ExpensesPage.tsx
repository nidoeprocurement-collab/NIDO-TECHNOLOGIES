import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeReadJson } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Ellipsis, ImageUp, Plus } from "lucide-react";
import { usePageMeta } from "@/contexts/PageMetaContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type BillableStatus = "BILLABLE" | "NON-BILLABLE";

interface ExpenseEntry {
  id: string;
  date: string;
  expenseAccount: string;
  referenceNumber: string;
  vendorName: string;
  paidThrough: string;
  customerName: string;
  status: BillableStatus;
  amount: number;
  expenseType: "Goods" | "Services";
  sac: string;
  gstTreatment: string;
  sourceOfSupply: string;
  destinationOfSupply: string;
  reverseCharge: boolean;
  taxLabel: string;
  taxPercent: number;
  taxAmount: number;
  amountIs: "Tax Inclusive" | "Tax Exclusive";
  invoiceNumber: string;
  notes: string;
  reportingTags: string[];
  receipts: string[];
}

const STORAGE_KEY = "nido_expenses_v1";

const defaultExpenses: ExpenseEntry[] = [
  {
    id: "ex-1",
    date: "2020-08-28",
    expenseAccount: "Automobile Expense",
    referenceNumber: "S14682",
    vendorName: "WICKED RIDE ADVENTURE SERVICES PVT LTD",
    paidThrough: "GST Payable",
    customerName: "-",
    status: "NON-BILLABLE",
    amount: 44835,
    expenseType: "Services",
    sac: "3921",
    gstTreatment: "Registered Business - Regular",
    sourceOfSupply: "Karnataka",
    destinationOfSupply: "Karnataka",
    reverseCharge: false,
    taxLabel: "GST18",
    taxPercent: 18,
    taxAmount: 6839.24,
    amountIs: "Tax Inclusive",
    invoiceNumber: "160",
    notes: "Auto expense paid for operations.",
    reportingTags: ["Materials"],
    receipts: [],
  },
  {
    id: "ex-2",
    date: "2020-06-26",
    expenseAccount: "Materials",
    referenceNumber: "160",
    vendorName: "Monish Glass Plywood & Hardware",
    paidThrough: "Petty Cash",
    customerName: "Mr. Workshaala Spaces",
    status: "NON-BILLABLE",
    amount: 44835,
    expenseType: "Goods",
    sac: "3921",
    gstTreatment: "Registered Business - Regular",
    sourceOfSupply: "Karnataka",
    destinationOfSupply: "Karnataka",
    reverseCharge: false,
    taxLabel: "GST18",
    taxPercent: 18,
    taxAmount: 6839.24,
    amountIs: "Tax Inclusive",
    invoiceNumber: "160",
    notes: "1. Clarification will be made post quality check mutually.",
    reportingTags: ["Materials"],
    receipts: ["bill-materials-june.pdf"],
  },
  {
    id: "ex-3",
    date: "2020-06-13",
    expenseAccount: "Materials",
    referenceNumber: "132",
    vendorName: "Monish Glass Plywood & Hardware",
    paidThrough: "Petty Cash",
    customerName: "Mr. Workshaala Spaces",
    status: "NON-BILLABLE",
    amount: 22100,
    expenseType: "Goods",
    sac: "3921",
    gstTreatment: "Registered Business - Regular",
    sourceOfSupply: "Karnataka",
    destinationOfSupply: "Karnataka",
    reverseCharge: false,
    taxLabel: "GST18",
    taxPercent: 18,
    taxAmount: 3371.18,
    amountIs: "Tax Inclusive",
    invoiceNumber: "132",
    notes: "Consumables for workshop.",
    reportingTags: ["Materials"],
    receipts: [],
  },
];

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);

// ── Print sheet ───────────────────────────────────────────────────────────────
function ExpensePrintSheet({ entry }: { entry: ExpenseEntry }) {
  return (
    <div className="mx-auto w-[794px] border border-slate-200 bg-white px-8 py-8 text-slate-900">
      <h1 className="text-2xl font-semibold">Expense Detail</h1>
      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Expense Amount</p>
          <p className="text-4xl font-semibold text-rose-500">
            {fmtCurrency(entry.amount)}
          </p>
          <p className="text-xs text-muted-foreground">on {entry.date}</p>
          <p className="mt-1 text-xs font-medium">{entry.status}</p>
          <Badge className="mt-2" variant="secondary">
            {entry.expenseAccount}
          </Badge>
        </div>
        <div className="w-[220px] rounded-xl border border-dashed p-4 text-center">
          <ImageUp className="mx-auto h-10 w-10 text-slate-500" />
          <p className="mt-3 text-sm font-medium">Receipt</p>
          <p className="text-xs text-muted-foreground">Attached in app</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
        <div><p className="text-xs text-muted-foreground">Paid Through</p><p>{entry.paidThrough}</p></div>
        <div><p className="text-xs text-muted-foreground">Tax</p><p>{entry.taxLabel} ({entry.taxPercent}%)</p></div>
        <div><p className="text-xs text-muted-foreground">Tax Amount</p><p>{fmtCurrency(entry.taxAmount)} ({entry.amountIs})</p></div>
        <div><p className="text-xs text-muted-foreground">Ref #</p><p>{entry.referenceNumber}</p></div>
        <div><p className="text-xs text-muted-foreground">Customer</p><p>{entry.customerName}</p></div>
        <div><p className="text-xs text-muted-foreground">Paid To</p><p>{entry.vendorName}</p></div>
        <div><p className="text-xs text-muted-foreground">GST Treatment</p><p>{entry.gstTreatment}</p></div>
        <div><p className="text-xs text-muted-foreground">HSN Code</p><p>{entry.sac || "-"}</p></div>
        <div><p className="text-xs text-muted-foreground">Source of Supply</p><p>{entry.sourceOfSupply}</p></div>
        <div><p className="text-xs text-muted-foreground">Destination of Supply</p><p>{entry.destinationOfSupply}</p></div>
      </div>
      <div className="mt-8 border-t pt-4">
        <p className="text-sm font-semibold">Journal</p>
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>ACCOUNT</TableHead>
              <TableHead className="text-right">DEBIT</TableHead>
              <TableHead className="text-right">CREDIT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{entry.expenseAccount}</TableCell>
              <TableCell className="text-right">{(entry.amount - entry.taxAmount).toFixed(2)}</TableCell>
              <TableCell className="text-right">0.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{entry.paidThrough}</TableCell>
              <TableCell className="text-right">0.00</TableCell>
              <TableCell className="text-right">{entry.amount.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Input SGST</TableCell>
              <TableCell className="text-right">{(entry.taxAmount / 2).toFixed(2)}</TableCell>
              <TableCell className="text-right">0.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Input CGST</TableCell>
              <TableCell className="text-right">{(entry.taxAmount / 2).toFixed(2)}</TableCell>
              <TableCell className="text-right">0.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">{entry.amount.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold">{entry.amount.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { setMeta } = usePageMeta();
  useEffect(() => { setMeta({ title: "Expenses" }); }, []);

  const navigate = useNavigate();
  const params = useParams();

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() =>
    safeReadJson<ExpenseEntry[]>(STORAGE_KEY, defaultExpenses),
  );
  const [selectedId, setSelectedId] = useState<string>(
    params.id || expenses[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<"all" | "receipts">("all");
  const detailUploadRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.id) setSelectedId(params.id);
  }, [params.id]);

  const selected = useMemo(
    () => expenses.find((e) => e.id === selectedId) || expenses[0] || null,
    [expenses, selectedId],
  );

  const persist = (next: ExpenseEntry[]) => {
    setExpenses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const reactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Expense-Detail",
    pageStyle:
      "@page { size: A4; margin: 12mm; } @media print { body * { visibility: hidden; } #expense-print-area, #expense-print-area * { visibility: visible; } #expense-print-area { position: absolute; top: 0; left: 0; width: 100%; background: white; } }",
  });

  const deleteSelected = () => {
    if (!selected) return;
    const next = expenses.filter((e) => e.id !== selected.id);
    persist(next);
    setSelectedId(next[0]?.id || "");
    toast({ title: "Expense deleted" });
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const clone = { ...selected, id: `ex-${Date.now()}`, referenceNumber: `${selected.referenceNumber}-COPY` };
    persist([clone, ...expenses]);
    setSelectedId(clone.id);
    toast({ title: "Expense duplicated" });
  };

  const onDetailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const names = files.map((f) => f.name);
    persist(expenses.map((entry) =>
      entry.id === selected.id
        ? { ...entry, receipts: [...entry.receipts, ...names] }
        : entry,
    ));
    toast({ title: `${files.length} receipt(s) attached` });
    e.target.value = "";
  };

  const detailTaxLabel = selected ? `${selected.taxLabel} (${selected.taxPercent}%)` : "-";

  return (
    <div>
      <div className="space-y-4 p-6">
        {/* ── Header card with tabs ── */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  className={`pb-2 text-lg font-medium transition-colors ${
                    activeTab === "receipts"
                      ? "border-b-2 border-blue-500 text-slate-900"
                      : "text-muted-foreground hover:text-slate-700"
                  }`}
                  onClick={() => setActiveTab("receipts")}
                >
                  Receipts Inbox
                </button>
                <button
                  type="button"
                  className={`pb-2 text-3xl font-semibold leading-none transition-colors ${
                    activeTab === "all"
                      ? "border-b-2 border-blue-500 text-slate-900"
                      : "text-muted-foreground hover:text-slate-700"
                  }`}
                  onClick={() => setActiveTab("all")}
                >
                  All Expenses
                </button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/transactions/purchase/expenses/create")}>
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => toast({ title: "Export started" })}>
                      Export Expenses
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast({ title: "Bulk import opened" })}>
                      Import Expenses
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("receipts")}>
                      Open Receipts Inbox
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── All Expenses table ── */}
        {activeTab === "all" ? (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"><Checkbox checked={false} /></TableHead>
                    <TableHead>DATE</TableHead>
                    <TableHead>EXPENSE ACCOUNT</TableHead>
                    <TableHead>REFERENCE#</TableHead>
                    <TableHead>VENDOR NAME</TableHead>
                    <TableHead>PAID THROUGH</TableHead>
                    <TableHead>CUSTOMER NAME</TableHead>
                    <TableHead>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={`cursor-pointer ${selected?.id === entry.id ? "bg-blue-50" : ""}`}
                      onClick={() => {
                        setSelectedId(entry.id);
                        navigate(`/transactions/purchase/expenses/${entry.id}`);
                      }}
                    >
                      <TableCell>
                        <Checkbox checked={false} onClick={(e) => e.stopPropagation()} />
                      </TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left font-medium text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(entry.id);
                            navigate(`/transactions/purchase/expenses/${entry.id}`);
                          }}
                        >
                          {entry.expenseAccount}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(entry.id);
                            navigate(`/transactions/purchase/expenses/${entry.id}`);
                          }}
                        >
                          {entry.referenceNumber}
                        </button>
                      </TableCell>
                      <TableCell>{entry.vendorName}</TableCell>
                      <TableCell>{entry.paidThrough}</TableCell>
                      <TableCell>{entry.customerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            entry.status === "BILLABLE"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* ── Receipts Inbox ── */
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATE</TableHead>
                    <TableHead>EXPENSE ACCOUNT</TableHead>
                    <TableHead>REFERENCE#</TableHead>
                    <TableHead>RECEIPTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses
                    .filter((e) => e.receipts.length > 0)
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.expenseAccount}</TableCell>
                        <TableCell>{entry.referenceNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {entry.receipts.map((name) => (
                              <Badge key={`${entry.id}-${name}`} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {expenses.filter((e) => e.receipts.length > 0).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No uploaded receipts yet. Upload files from New Expense or Expense Detail.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Selected Expense Detail panel ── */}
        {selected && (
          <Card>
            <CardContent className="pt-5">
              <h3 className="text-lg font-semibold">Expense Details</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-b pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/transactions/purchase/expenses/create")}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast({ title: "Recurring rule created" })}
                >
                  Make Recurring
                </Button>
                <Button variant="outline" size="sm" onClick={reactToPrint}>
                  Print
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={duplicateSelected}>
                      Duplicate Expense
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast({ title: "Marked as billable" })}>
                      Mark as Billable
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={deleteSelected}>
                      Delete Expense
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_220px]">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Expense Amount</p>
                    <p className="text-3xl font-semibold text-rose-500">{fmtCurrency(selected.amount)}</p>
                    <p className="text-xs text-muted-foreground">on {selected.date}</p>
                    <p className="mt-1 text-xs font-medium">{selected.status}</p>
                    <Badge className="mt-2" variant="secondary">{selected.expenseAccount}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">Paid Through</p><p>{selected.paidThrough}</p></div>
                    <div><p className="text-xs text-muted-foreground">Tax</p><p>{detailTaxLabel}</p></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tax Amount</p>
                      <p>{fmtCurrency(selected.taxAmount)} ({selected.amountIs})</p>
                    </div>
                    <div><p className="text-xs text-muted-foreground">Ref #</p><p>{selected.referenceNumber}</p></div>
                    <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-blue-600">{selected.customerName}</p></div>
                    <div><p className="text-xs text-muted-foreground">Paid To</p><p className="text-blue-600">{selected.vendorName}</p></div>
                    <div><p className="text-xs text-muted-foreground">GST Treatment</p><p>{selected.gstTreatment}</p></div>
                    <div><p className="text-xs text-muted-foreground">GSTIN / UIN</p><p>29BAAPR5775A1ZL</p></div>
                    <div><p className="text-xs text-muted-foreground">HSN Code</p><p>{selected.sac || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Source of Supply</p><p>{selected.sourceOfSupply}</p></div>
                    <div><p className="text-xs text-muted-foreground">Destination of Supply</p><p>{selected.destinationOfSupply}</p></div>
                  </div>
                </div>

                {/* Receipt upload */}
                <div className="rounded-xl border border-dashed p-4 text-center">
                  <ImageUp className="mx-auto h-10 w-10 text-slate-500" />
                  <p className="mt-3 text-sm font-medium">Drag or Drop your Receipts</p>
                  <p className="text-xs text-muted-foreground">Maximum file size allowed is 10 MB</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => detailUploadRef.current?.click()}
                  >
                    Upload your Files
                  </Button>
                  <input ref={detailUploadRef} type="file" multiple className="hidden" onChange={onDetailUpload} />
                  {selected.receipts.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {selected.receipts.map((name) => (
                        <Badge key={`${selected.id}-${name}`} variant="secondary" className="gap-2">
                          {name}
                          <button
                            type="button"
                            onClick={() =>
                              persist(expenses.map((entry) =>
                                entry.id === selected.id
                                  ? { ...entry, receipts: entry.receipts.filter((v) => v !== name) }
                                  : entry,
                              ))
                            }
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Journal */}
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-semibold">Journal</p>
                <p className="mt-1 text-xs text-muted-foreground">Amount is displayed in your base currency</p>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ACCOUNT</TableHead>
                      <TableHead className="text-right">DEBIT</TableHead>
                      <TableHead className="text-right">CREDIT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selected.expenseAccount}</TableCell>
                      <TableCell className="text-right">{(selected.amount - selected.taxAmount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">0.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{selected.paidThrough}</TableCell>
                      <TableCell className="text-right">0.00</TableCell>
                      <TableCell className="text-right">{selected.amount.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Input SGST</TableCell>
                      <TableCell className="text-right">{(selected.taxAmount / 2).toFixed(2)}</TableCell>
                      <TableCell className="text-right">0.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Input CGST</TableCell>
                      <TableCell className="text-right">{(selected.taxAmount / 2).toFixed(2)}</TableCell>
                      <TableCell className="text-right">0.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold">{selected.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{selected.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden print area */}
      <div className="fixed left-[-10000px] top-0 w-[794px] bg-white">
        <div ref={printRef} id="expense-print-area">
          {selected ? <ExpensePrintSheet entry={selected} /> : null}
        </div>
      </div>
    </div>
  );
}
