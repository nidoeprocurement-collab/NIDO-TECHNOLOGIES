import { useState, useRef, useEffect } from "react";
import {
  FileText, CheckCircle, Clock, IndianRupee, RefreshCcw,
  MoreVertical, Eye, ChevronDown, ChevronLeft, ChevronRight,
  X, Download, Archive, Pencil, Check,
  User, AlertTriangle, Plus, Upload,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────── */
type ContractStatus = "Active" | "Expired" | "Expiring Soon" | "Archived";
type ContractType = "Supply Agreement" | "SLA" | "NDA" | "AMC" | "Framework";

interface Contract {
  id: string; name: string; type: ContractType;
  startDate: string; endDate: string; value: string; paymentTerms: string;
  status: ContractStatus; autoRenewal: boolean; renewalReminder: string; expiryIn: string | null;
  contacts: { owner: string; vendor: string; vendorPhone: string; procurement: string; procurementPhone: string };
  terms: { priceValidity: string; deliveryTerm: string; warrantyPeriod: string; slaUptime: string; penaltyClause: string; governingLaw: string };
}

/* ─── Static data ───────────────────────────────────────────────────────── */
const CONTRACTS: Contract[] = [
  { id: "CT-2025-001", name: "IT Hardware Supply Agreement 2025", type: "Supply Agreement", startDate: "Jan 01, 2025", endDate: "Dec 31, 2026", value: "₹8,00,00,000", paymentTerms: "Net 30", status: "Active", autoRenewal: true, renewalReminder: "60 Days Before Expiry", expiryIn: "252 Days", contacts: { owner: "Pavan (System Owner)", vendor: "Rahul Sharma", vendorPhone: "+91 98765 43210", procurement: "Sneha Iyer", procurementPhone: "+91 98740 11122" }, terms: { priceValidity: "Till Dec 31, 2026", deliveryTerm: "FOB - Destination", warrantyPeriod: "3 Years Onsite", slaUptime: "99.5%", penaltyClause: "Applicable", governingLaw: "Karnataka, India" } },
  { id: "CT-2024-001", name: "Service Level Agreement 2024", type: "SLA", startDate: "Mar 01, 2024", endDate: "Feb 28, 2025", value: "₹2,00,00,000", paymentTerms: "Net 30", status: "Active", autoRenewal: false, renewalReminder: "30 Days Before Expiry", expiryIn: null, contacts: { owner: "Pavan (System Owner)", vendor: "Ravi Kumar", vendorPhone: "+91 99887 66554", procurement: "Anita Desai", procurementPhone: "+91 87654 32100" }, terms: { priceValidity: "Till Feb 28, 2025", deliveryTerm: "Ex-Works", warrantyPeriod: "1 Year", slaUptime: "99.0%", penaltyClause: "Applicable", governingLaw: "Maharashtra, India" } },
  { id: "CT-2023-001", name: "NDA Agreement", type: "NDA", startDate: "Feb 10, 2023", endDate: "Feb 09, 2026", value: "₹80,00,000", paymentTerms: "Net 30", status: "Expired", autoRenewal: false, renewalReminder: "30 Days Before Expiry", expiryIn: null, contacts: { owner: "Pavan (System Owner)", vendor: "Meena Pillai", vendorPhone: "+91 91234 56789", procurement: "Kartik Rao", procurementPhone: "+91 90000 12345" }, terms: { priceValidity: "Till Feb 09, 2026", deliveryTerm: "N/A", warrantyPeriod: "N/A", slaUptime: "N/A", penaltyClause: "Not Applicable", governingLaw: "Karnataka, India" } },
];

const ARCHIVED_CONTRACTS: Contract[] = [
  { id: "CT-2022-001", name: "Hardware Maintenance Contract 2022", type: "AMC", startDate: "Jan 15, 2022", endDate: "Jan 14, 2023", value: "₹45,00,000", paymentTerms: "Net 45", status: "Archived", autoRenewal: false, renewalReminder: "30 Days Before Expiry", expiryIn: null, contacts: { owner: "Pavan (System Owner)", vendor: "Suresh Nair", vendorPhone: "+91 98001 23456", procurement: "Divya Menon", procurementPhone: "+91 87001 23456" }, terms: { priceValidity: "Till Jan 14, 2023", deliveryTerm: "Onsite", warrantyPeriod: "1 Year", slaUptime: "98.0%", penaltyClause: "Applicable", governingLaw: "Kerala, India" } },
  { id: "CT-2021-001", name: "Framework Agreement 2021", type: "Framework", startDate: "Apr 01, 2021", endDate: "Mar 31, 2022", value: "₹1,20,00,000", paymentTerms: "Net 60", status: "Archived", autoRenewal: false, renewalReminder: "45 Days Before Expiry", expiryIn: null, contacts: { owner: "Pavan (System Owner)", vendor: "Arjun Das", vendorPhone: "+91 97001 23456", procurement: "Priya Sharma", procurementPhone: "+91 86001 23456" }, terms: { priceValidity: "Till Mar 31, 2022", deliveryTerm: "CIF", warrantyPeriod: "2 Years", slaUptime: "98.5%", penaltyClause: "Applicable", governingLaw: "Delhi, India" } },
];

/* ─── Dropdown options ──────────────────────────────────────────────────── */
const CONTRACT_TYPES = ["Supply Agreement", "Service Agreement", "SLA (Service Level Agreement)", "NDA (Non-Disclosure Agreement)", "Purchase Agreement", "Maintenance Agreement", "Reseller Agreement", "Other"];
const CATEGORIES = ["IT Hardware", "IT Software", "Networking", "Cloud Services", "Peripherals", "Accessories", "Services", "Consulting", "Other"];
const DELIVERY_TERMS = ["FOB - Origin", "FOB - Destination", "CIF", "DDP (Delivered Duty Paid)", "DAP (Delivered at Place)", "EXW (Ex Works)", "Other"];
const WARRANTY_PERIODS = ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years", "3 Years", "5 Years", "Custom"];
const PENALTY_CLAUSES = ["Standard Penalty", "Liquidated Damages", "Service Credit", "Termination Right", "Custom"];
const GOVERNING_LAWS = ["India", "United States", "United Kingdom", "Singapore", "Germany", "Other"];
const CONFIDENTIALITY = ["Public", "Internal", "Confidential", "Highly Confidential"];
const CURRENCIES = ["INR - Indian Rupee", "USD - US Dollar", "EUR - Euro", "GBP - British Pound", "SGD - Singapore Dollar", "AED - UAE Dirham", "Other"];
const PAYMENT_METHODS = ["Bank Transfer", "Cheque", "NEFT", "RTGS", "UPI", "Credit Card", "Other"];
const TAX_TREATMENTS = ["Taxable (With GST)", "Taxable (Without GST)", "Exempt", "Zero Rated"];
const PAYMENT_TERMS_LIST = ["Net 15", "Net 30", "Net 45", "Net 60", "Advance", "Immediate"];
const RENEWAL_REMINDERS = ["30 Days Before Expiry", "45 Days Before Expiry", "60 Days Before Expiry", "90 Days Before Expiry", "Custom"];
const OWNERS = ["Pavan (System Owner)", "Sneha Iyer", "Amit Kumar", "Neha Kapoor", "Menci Patel", "Vikram Singh", "Other"];
const VENDOR_CONTACTS = ["Rahul Sharma", "Amit Kumar", "Priya Nair", "Neha Kapoor", "Menci Patel", "Other"];
const PROCUREMENT_HEADS = ["Pavan (System Owner)", "Sneha Iyer", "Amit Verma", "Neha Kapoor", "Vikram Singh", "Other"];

/* ─── Style maps ───────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<ContractStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Expired: "bg-red-100 text-red-600",
  "Expiring Soon": "bg-orange-100 text-orange-600",
  Archived: "bg-gray-100 text-gray-500",
};
const TYPE_STYLES: Record<ContractType, string> = {
  "Supply Agreement": "bg-blue-100 text-blue-700",
  SLA: "bg-purple-100 text-purple-700",
  NDA: "bg-cyan-100 text-cyan-700",
  AMC: "bg-yellow-100 text-yellow-700",
  Framework: "bg-indigo-100 text-indigo-700",
};

/* ─── Helper components ─────────────────────────────────────────────────── */
function SelectField({ label, options, value, onChange, placeholder, required }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-9 h-[40px]">
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, required, type = "text", autoGen }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; autoGen?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={autoGen ? "Auto-generated" : placeholder}
        className={`w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${autoGen ? "bg-gray-50 text-gray-400 italic" : "bg-white text-gray-700 placeholder:text-gray-400"}`} />
    </div>
  );
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 mb-4 border-b border-gray-100">
      <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">{num}</span>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

/* ─── Add / Edit Contract full page ────────────────────────────────────── */
function AddContractPage({ onCancel, contract, onSave }: {
  onCancel: () => void;
  contract?: Contract;
  onSave: (c: Contract) => void;
}) {
  const isEdit = !!contract;

  const [form, setForm] = useState({
    contractName: contract?.name ?? "",
    contractId: contract?.id ?? "",
    contractType: contract?.type ?? "",
    category: "",
    startDate: contract?.startDate ?? "",
    endDate: contract?.endDate ?? "",
    contractValue: contract?.value ? contract.value.replace(/[₹,]/g, "") : "",
    paymentTerms: contract?.paymentTerms ?? "",
    renewal: contract?.autoRenewal ?? false,
    renewalReminder: contract?.renewalReminder ?? "",
    daysBeforeExpiry: "60",
    slaUptime: contract?.terms.slaUptime ? contract.terms.slaUptime.replace("%", "") : "99.5",
    deliveryTerm: contract?.terms.deliveryTerm ?? "",
    warrantyPeriod: contract?.terms.warrantyPeriod ?? "",
    penaltyClause: contract?.terms.penaltyClause ?? "",
    governingLaw: contract?.terms.governingLaw ?? "",
    confidentiality: "",
    currency: "INR - Indian Rupee",
    paymentMethod: "",
    taxTreatment: "",
    creditLimit: "0.00",
    availableCredit: "0.00",
    contractScope: "",
    exclusions: "",
    internalNotes: "",
    contractOwner: contract?.contacts.owner ?? "",
    vendorContact: contract?.contacts.vendor ?? "",
    procurementHead: contract?.contacts.procurement ?? "",
    documents: [] as string[],
  });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const updated: Contract = {
      id: form.contractId || contract?.id || `CT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
      name: form.contractName || "Untitled Contract",
      type: (form.contractType as ContractType) || contract?.type || "Supply Agreement",
      startDate: form.startDate || contract?.startDate || "",
      endDate: form.endDate || contract?.endDate || "",
      value: form.contractValue ? `₹${Number(form.contractValue.replace(/,/g, "")).toLocaleString("en-IN")}` : contract?.value || "₹0",
      paymentTerms: form.paymentTerms || contract?.paymentTerms || "Net 30",
      status: contract?.status || "Active",
      autoRenewal: form.renewal,
      renewalReminder: form.renewalReminder || contract?.renewalReminder || "30 Days Before Expiry",
      expiryIn: contract?.expiryIn ?? null,
      contacts: {
        owner: form.contractOwner || contract?.contacts.owner || "",
        vendor: form.vendorContact || contract?.contacts.vendor || "",
        vendorPhone: contract?.contacts.vendorPhone || "",
        procurement: form.procurementHead || contract?.contacts.procurement || "",
        procurementPhone: contract?.contacts.procurementPhone || "",
      },
      terms: {
        priceValidity: contract?.terms.priceValidity || `Till ${form.endDate}`,
        deliveryTerm: form.deliveryTerm || contract?.terms.deliveryTerm || "",
        warrantyPeriod: form.warrantyPeriod || contract?.terms.warrantyPeriod || "",
        slaUptime: form.slaUptime ? `${form.slaUptime}%` : contract?.terms.slaUptime || "99.5%",
        penaltyClause: form.penaltyClause || contract?.terms.penaltyClause || "",
        governingLaw: form.governingLaw || contract?.terms.governingLaw || "",
      },
    };
    onSave(updated);
  };

  // Derived summary
  const summary = [
    { label: "Contract Type", value: form.contractType || "-" },
    { label: "Start Date", value: form.startDate || "-" },
    { label: "End Date", value: form.endDate || "-" },
    { label: "Contract Value", value: form.contractValue ? `₹${form.contractValue}` : "-" },
    { label: "Payment Terms", value: form.paymentTerms || "-" },
    { label: "Auto Renewal", value: form.renewal ? "Yes" : "-" },
    { label: "Status", value: isEdit ? (contract?.status ?? "Active") : "Draft", badge: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? "Edit Contract" : "Add Contract"}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{isEdit ? `Editing ${contract?.id} — Dell India Pvt. Ltd.` : "Create a new contract for Dell India Pvt. Ltd."}</p>
      </div>

      <div className="px-6 py-5 max-w-[1280px] mx-auto space-y-5">
        {/* Vendor card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">D</div>
            <div className="flex-1 flex items-start gap-8 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">Dell India Pvt. Ltd.</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Active</span>
                </div>
              </div>
              {[["Vendor ID", "VEN-1001"], ["Vendor Code", "DELL-IND-001"], ["Category", "IT Hardware"], ["Vendor Type", "Supplier"]].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-400">{l}</p>
                  <p className="text-sm font-semibold text-gray-700">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-column: left = vertical sections, right = sidebar ── */}
        <div className="flex gap-6 items-start">

          {/* ── LEFT: all form sections stacked vertically ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ① Contract Information */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <SectionHeader num={1} title="Contract Information" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2">
                  <InputField label="Contract Name" placeholder="Enter contract name" value={form.contractName} onChange={v => set("contractName", v)} required />
                </div>
                <InputField label="Contract ID" value={form.contractId} onChange={v => set("contractId", v)} required autoGen />
                <SelectField label="Contract Type" options={CONTRACT_TYPES} value={form.contractType} onChange={v => set("contractType", v)} placeholder="Select contract type" required />
                <SelectField label="Category" options={CATEGORIES} value={form.category} onChange={v => set("category", v)} placeholder="Select category" required />
                <div className="col-span-1" />
                <InputField label="Start Date" type="date" value={form.startDate} onChange={v => set("startDate", v)} required />
                <InputField label="End Date" type="date" value={form.endDate} onChange={v => set("endDate", v)} required />
                {/* Contract Value */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Contract Value<span className="text-red-400 ml-0.5">*</span></label>
                  <div className="flex h-[40px]">
                    <div className="relative flex-shrink-0">
                      <select defaultValue="INR" className="appearance-none border border-gray-200 border-r-0 rounded-l-lg px-3 text-sm text-gray-600 bg-gray-50 pr-7 h-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>INR</option><option>USD</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <input value={form.contractValue} onChange={e => set("contractValue", e.target.value)} placeholder="0.00" className="flex-1 border border-gray-200 rounded-r-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
                  </div>
                </div>
                <SelectField label="Payment Terms" options={PAYMENT_TERMS_LIST} value={form.paymentTerms} onChange={v => set("paymentTerms", v)} placeholder="Select payment terms" required />
                {/* Renewal toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => set("renewal", !form.renewal)} className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${form.renewal ? "bg-blue-600" : "bg-gray-200"}`}>
                    <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform ${form.renewal ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">Auto Renewal</span>
                </div>
                <div className="col-span-1" />
                <SelectField label="Renewal Reminder" options={RENEWAL_REMINDERS} value={form.renewalReminder} onChange={v => set("renewalReminder", v)} placeholder="Select reminder" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Days Before Expiry</label>
                  <div className="flex items-center gap-2 h-[40px]">
                    <input value={form.daysBeforeExpiry} onChange={e => set("daysBeforeExpiry", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-full" />
                    <span className="text-sm text-gray-400 whitespace-nowrap">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ② Terms & Conditions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <SectionHeader num={2} title="Terms & Conditions" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">SLA Uptime (%)</label>
                  <div className="flex items-center gap-2 h-[40px]">
                    <input value={form.slaUptime} onChange={e => set("slaUptime", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-full" />
                    <span className="text-sm font-medium text-gray-500">%</span>
                  </div>
                </div>
                <SelectField label="Delivery Term" options={DELIVERY_TERMS} value={form.deliveryTerm} onChange={v => set("deliveryTerm", v)} placeholder="Select delivery term" required />
                <SelectField label="Warranty Period" options={WARRANTY_PERIODS} value={form.warrantyPeriod} onChange={v => set("warrantyPeriod", v)} placeholder="Select warranty period" />
                <SelectField label="Penalty Clause" options={PENALTY_CLAUSES} value={form.penaltyClause} onChange={v => set("penaltyClause", v)} placeholder="Select penalty clause" />
                <SelectField label="Governing Law" options={GOVERNING_LAWS} value={form.governingLaw} onChange={v => set("governingLaw", v)} placeholder="Select governing law" />
                <SelectField label="Confidentiality" options={CONFIDENTIALITY} value={form.confidentiality} onChange={v => set("confidentiality", v)} placeholder="Select confidentiality level" />
              </div>
            </div>

            {/* ③ Financial Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <SectionHeader num={3} title="Financial Details" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <SelectField label="Currency" options={CURRENCIES} value={form.currency} onChange={v => set("currency", v)} required />
                <SelectField label="Payment Method" options={PAYMENT_METHODS} value={form.paymentMethod} onChange={v => set("paymentMethod", v)} placeholder="Select payment method" />
                <SelectField label="Tax Treatment" options={TAX_TREATMENTS} value={form.taxTreatment} onChange={v => set("taxTreatment", v)} placeholder="Select tax treatment" />
                <div className="col-span-1" />
                {/* Credit Limit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Credit Limit <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                  <div className="flex h-[40px]">
                    <div className="relative flex-shrink-0">
                      <select defaultValue="INR" className="appearance-none border border-gray-200 border-r-0 rounded-l-lg px-3 text-sm text-gray-600 bg-gray-50 pr-7 h-full focus:outline-none">
                        <option>INR</option><option>USD</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <input value={form.creditLimit} onChange={e => set("creditLimit", e.target.value)} className="flex-1 border border-gray-200 rounded-r-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
                  </div>
                </div>
                {/* Available Credit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Available Credit <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                  <div className="flex h-[40px]">
                    <div className="relative flex-shrink-0">
                      <select defaultValue="INR" className="appearance-none border border-gray-200 border-r-0 rounded-l-lg px-3 text-sm text-gray-600 bg-gray-50 pr-7 h-full focus:outline-none">
                        <option>INR</option><option>USD</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <input value={form.availableCredit} onChange={e => set("availableCredit", e.target.value)} className="flex-1 border border-gray-200 rounded-r-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
                  </div>
                </div>
                <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-blue-500 flex-shrink-0 text-sm mt-0.5">ℹ</span>
                  <span className="text-sm text-blue-700">Credit limit will be validated against vendor's approved credit.</span>
                </div>
              </div>
            </div>

            {/* ④ Scope of Work */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <SectionHeader num={4} title="Scope of Work" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Contract Scope<span className="text-red-400 ml-0.5">*</span></label>
                  <textarea rows={5} value={form.contractScope} onChange={e => set("contractScope", e.target.value)} placeholder="Enter scope of work and deliverables" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Exclusions <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                  <textarea rows={5} value={form.exclusions} onChange={e => set("exclusions", e.target.value)} placeholder="Enter exclusions or out-of-scope items" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            </div>

            {/* ⑥ Internal Notes */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <SectionHeader num={6} title="Internal Notes" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600">Notes <span className="text-gray-400 font-normal text-xs">(Visible internally only)</span></label>
                <textarea rows={4} value={form.internalNotes} onChange={e => set("internalNotes", e.target.value)} placeholder="Add any internal notes or comments about this contract" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <p className="text-xs text-gray-300 text-right mt-1">{form.internalNotes.length}/1000 characters</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: sidebar panels ── */}
          <div className="w-[310px] flex-shrink-0 space-y-5">

            {/* Contract Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 pb-3 mb-4 border-b border-gray-100">Contract Summary</h3>
              <div className="space-y-3">
                {summary.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-400">{s.label}</span>
                    {s.badge
                      ? <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-md">{s.value}</span>
                      : <span className="text-sm font-semibold text-gray-700 text-right">{s.value}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Contacts */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 pb-3 mb-4 border-b border-gray-100">Key Contacts</h3>
              <div className="space-y-4">
                <SelectField label="Contract Owner" options={OWNERS} value={form.contractOwner} onChange={v => set("contractOwner", v)} placeholder="Select owner" required />
                <SelectField label="Vendor Contact" options={VENDOR_CONTACTS} value={form.vendorContact} onChange={v => set("vendorContact", v)} placeholder="Select vendor contact" required />
                <SelectField label="Procurement Head" options={PROCUREMENT_HEADS} value={form.procurementHead} onChange={v => set("procurementHead", v)} placeholder="Select head" />
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 pb-3 mb-4 border-b border-gray-100">Documents</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-7 gap-2.5 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 text-center leading-snug">Drag and drop files here<br /><span className="text-gray-400 font-normal">or click to upload</span></p>
                <p className="text-xs text-gray-400 text-center leading-snug">PDF, DOC, DOCX, XLS, XLSX · Max 10MB</p>
              </div>
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-blue-600 font-medium hover:underline py-1.5">
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>

            {/* ⑤ Attachments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-800 pb-3 mb-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">5</span>
                Attachments
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold w-7">#</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Name</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Type</th>
                      <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Req.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400 font-medium">No attachments yet</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline py-1">
                <Plus className="w-4 h-4" /> Add Attachment
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom action bar ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            {isEdit ? "Save Changes" : "Save Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Contract detail side panel ────────────────────────────────────────── */
function ProgressBar({ value, color = "bg-blue-500" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className={`${color} h-1.5 rounded-full`} style={{ width: `${value}%` }} /></div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">{value}%</span>
    </div>
  );
}

function ContractPanel({ contract, onClose, readOnly = false }: { contract: Contract; onClose: () => void; readOnly?: boolean }) {
  const [tab, setTab] = useState<"Details" | "Documents" | "Performance" | "History">("Details");
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[380px] flex-shrink-0">
      <div className="px-5 pt-4 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-base">{contract.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[contract.status]}`}>{contract.status}</span>
            {readOnly && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">Read Only</span>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-3">{contract.name}</p>
        <div className="flex gap-0">
          {(["Details", "Documents", "Performance", "History"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t}{t === "Documents" ? " (6)" : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {tab === "Details" && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Contract Information</h3>
                {!readOnly && <button className="text-xs text-blue-600 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50">Edit</button>}
              </div>
              <div className="space-y-2.5">
                {[{ label: "Contract Type", value: contract.type }, { label: "Start Date", value: contract.startDate }, { label: "End Date", value: contract.endDate }, { label: "Contract Value", value: contract.value }, { label: "Payment Terms", value: contract.paymentTerms }, { label: "Auto Renewal", value: contract.autoRenewal ? "Enabled" : "Disabled", green: contract.autoRenewal }, { label: "Renewal Reminder", value: contract.renewalReminder }, ...(contract.expiryIn ? [{ label: "Expiry In", value: contract.expiryIn, blue: true }] : [])].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-semibold ${'green' in row && row.green ? "text-green-600" : 'blue' in row && row.blue ? "text-blue-600" : "text-gray-800"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Key Contacts</h3>
                {!readOnly && <button className="text-xs text-blue-600 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50">Edit</button>}
              </div>
              <div className="space-y-3">
                {[{ label: "Contract Owner", name: contract.contacts.owner, phone: "", bg: "bg-blue-100", ic: "text-blue-600" }, { label: "Vendor Contact", name: contract.contacts.vendor, phone: contract.contacts.vendorPhone, bg: "bg-green-100", ic: "text-green-600" }, { label: "Procurement Head", name: contract.contacts.procurement, phone: contract.contacts.procurementPhone, bg: "bg-purple-100", ic: "text-purple-600" }].map(c => (
                  <div key={c.label}>
                    <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}><User className={`w-3.5 h-3.5 ${c.ic}`} /></div>
                      <div><p className="text-xs font-semibold text-gray-700">{c.name}</p>{c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Contract Terms (Summary)</h3>
                <button className="text-xs text-blue-600 hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {[{ label: "Price Validity", value: contract.terms.priceValidity }, { label: "Delivery Term", value: contract.terms.deliveryTerm }, { label: "Warranty Period", value: contract.terms.warrantyPeriod }, { label: "SLA Uptime", value: contract.terms.slaUptime }, { label: "Penalty Clause", value: contract.terms.penaltyClause }, { label: "Governing Law", value: contract.terms.governingLaw }].map(row => (
                  <div key={row.label} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 flex-1">{row.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {!readOnly && <button className="w-full flex items-center justify-center gap-2 py-2 border border-blue-200 rounded-lg text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"><FileText className="w-4 h-4" /> View Full Contract</button>}
          </>
        )}
        {tab === "Documents" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">6 Documents attached</p>
            {["IT Hardware Supply Agreement v2.pdf", "Annexure A - Pricing Schedule.xlsx", "Annexure B - SLA Terms.pdf", "NDA Signed Copy.pdf", "Purchase Order Copy.pdf", "Vendor Compliance Certificate.pdf"].map(doc => (
              <div key={doc} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-8 h-8 bg-red-50 rounded-md flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-red-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-800 truncate">{doc}</p><p className="text-xs text-gray-400">Added Jan 01, 2025</p></div>
                <Download className="w-4 h-4 text-gray-400 hover:text-blue-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
        {tab === "Performance" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-800">Contract Performance (This Year)</p>
            {[{ label: "Spend vs Contract Value", sub: "₹6.25 Cr / ₹8.00 Cr", value: 78.2, color: "bg-blue-500" }, { label: "SLA Compliance", sub: "Target 90%", value: 94.2, color: "bg-green-500" }, { label: "On-time Delivery", sub: "Target 90%", value: 92.1, color: "bg-green-500" }, { label: "Invoice Compliance", sub: "Target 95%", value: 98.7, color: "bg-blue-500" }].map(m => (
              <div key={m.label}><div className="flex justify-between mb-1"><div><p className="text-xs font-medium text-gray-700">{m.label}</p><p className="text-xs text-gray-400">{m.sub}</p></div></div><ProgressBar value={m.value} color={m.color} /></div>
            ))}
            <div className="pt-2 border-t border-gray-100"><p className="text-xs text-gray-500">Savings Generated</p><p className="text-sm font-bold text-green-600">₹42.35 L <span className="text-xs text-gray-400 font-normal">This Year</span></p></div>
          </div>
        )}
        {tab === "History" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-800">Activity History</p>
            {[{ date: "May 16, 2026", action: "Contract reviewed by Pavan" }, { date: "Jan 01, 2025", action: "Contract activated" }, { date: "Dec 20, 2024", action: "Contract signed by vendor" }, { date: "Dec 10, 2024", action: "Contract drafted and sent for approval" }, { date: "Dec 01, 2024", action: "Contract initiated by Sneha Iyer" }].map((h, i, arr) => (
              <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                {i < arr.length - 1 && <div className="absolute left-1 top-6 bottom-0 w-px bg-gray-100" />}
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0 z-10" />
                <div className="pb-1"><p className="text-xs font-medium text-gray-700">{h.action}</p><p className="text-xs text-gray-400 mt-0.5">{h.date}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Archived modal ────────────────────────────────────────────────────── */
function ArchivedContractsModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Contract | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-500" />
            <div><h2 className="text-base font-bold text-gray-900">Archived Contracts</h2><p className="text-xs text-gray-500">Read-only view of archived contracts</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50/90 border-b border-gray-100">
                <tr>{["Contract ID", "Contract Name", "Type", "Start Date", "End Date", "Value", "Status"].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ARCHIVED_CONTRACTS.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap"><span className="text-blue-600 font-semibold text-sm">{c.id}</span></td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{c.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_STYLES[c.type]}`}>{c.type}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-sm">{c.startDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-sm">{c.endDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-700 text-sm">{c.value}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <div className="w-[360px] flex-shrink-0 border-l border-gray-200 overflow-hidden flex flex-col">
              <ContractPanel contract={selected} onClose={() => setSelected(null)} readOnly />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Dropdown hook ─────────────────────────────────────────────────────── */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return { open, setOpen, ref };
}

/* ���── Main export ─────────────────────────────────────────────────���─────── */
export default function VendorContractsPage() {
  const [contracts, setContracts] = useState(CONTRACTS);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [showAddContract, setShowAddContract] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const topMenu = useDropdown();

  const handleSaveContract = (updated: Contract) => {
    if (editingContract) {
      setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
      if (selectedContract?.id === updated.id) setSelectedContract(updated);
      setEditingContract(null);
    } else {
      setContracts(prev => [updated, ...prev]);
      setShowAddContract(false);
    }
  };

  const stats = [
    { icon: <FileText className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50", label: "Total Contracts", value: "3", sub: "All Time" },
    { icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: "bg-green-50", label: "Active Contracts", value: "2", sub: "Currently Active" },
    { icon: <Clock className="w-5 h-5 text-orange-400" />, bg: "bg-orange-50", label: "Expiring in 30 Days", value: "0", sub: "No Contracts" },
    { icon: <IndianRupee className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50", label: "Contract Value", value: "₹12,80,00,000", sub: "Total Value" },
    { icon: <RefreshCcw className="w-5 h-5 text-blue-400" />, bg: "bg-blue-50", label: "Renewal Rate", value: "100%", sub: "On-time Renewals" },
  ];

  if (showAddContract) {
    return <AddContractPage onCancel={() => setShowAddContract(false)} onSave={handleSaveContract} />;
  }
  if (editingContract) {
    return <AddContractPage onCancel={() => setEditingContract(null)} contract={editingContract} onSave={handleSaveContract} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans" onClick={() => setOpenRowMenu(null)}>
      <div className="flex min-h-screen">
        {selectedContract && <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSelectedContract(null)} />}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 py-6 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>{stat.icon}</div>
                  <p className="text-xs text-gray-500 font-medium mb-1 leading-tight">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">All Contracts</h3>
                <div className="relative" ref={topMenu.ref}>
                  <button onClick={() => topMenu.setOpen(o => !o)} className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {topMenu.open && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => { topMenu.setOpen(false); setShowAddContract(true); }}>
                        <Plus className="w-4 h-4 text-gray-400" /> Add Contract
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => { topMenu.setOpen(false); setShowArchived(true); }}>
                        <Archive className="w-4 h-4 text-gray-400" /> Archived Contracts
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => topMenu.setOpen(false)}>
                        <Download className="w-4 h-4 text-gray-400" /> Export All
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => topMenu.setOpen(false)}>
                        <AlertTriangle className="w-4 h-4 text-gray-400" /> Expiry Alerts
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex overflow-hidden" style={{ minHeight: 400 }}>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        {["Contract ID", "Contract Name", "Type", "Start Date", "End Date", "Value", "Payment Terms", "Status", "Actions"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {contracts.map(c => (
                        <tr key={c.id} onClick={() => setSelectedContract(selectedContract?.id === c.id ? null : c)} className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedContract?.id === c.id ? "bg-blue-50/40" : ""}`}>
                          <td className="px-4 py-3.5 whitespace-nowrap"><span className="text-blue-600 font-semibold text-sm">{c.id}</span></td>
                          <td className="px-4 py-3.5 max-w-[200px]"><p className="text-sm font-medium text-gray-800 truncate">{c.name}</p></td>
                          <td className="px-4 py-3.5 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_STYLES[c.type]}`}>{c.type}</span></td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">{c.startDate}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">{c.endDate}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-gray-800 text-sm">{c.value}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{c.paymentTerms}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                              {c.expiryIn && <span className="text-xs text-blue-600 font-medium">{c.expiryIn}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setSelectedContract(c)}><Eye className="w-4 h-4" /></button>
                              <div className="relative">
                                <button onClick={e => { e.stopPropagation(); setOpenRowMenu(openRowMenu === c.id ? null : c.id); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {openRowMenu === c.id && (
                                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => { setOpenRowMenu(null); setEditingContract(c); }}><Pencil className="w-4 h-4 text-gray-400" /> Edit</button>
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => setOpenRowMenu(null)}><Archive className="w-4 h-4 text-gray-400" /> Archive</button>
                                    <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => setOpenRowMenu(null)}><Download className="w-4 h-4 text-gray-400" /> Download</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedContract && (
                  <div className="hidden lg:flex w-[380px] flex-shrink-0 border-l border-gray-200 overflow-hidden">
                    <ContractPanel contract={selectedContract} onClose={() => setSelectedContract(null)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showArchived && <ArchivedContractsModal onClose={() => setShowArchived(false)} />}
    </div>
  );
}
