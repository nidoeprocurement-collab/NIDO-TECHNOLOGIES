import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Users,
  DollarSign,
  Construction,
  ShoppingCart,
  Building2,
  Globe,
  ChevronRight,
  FileText,
  Clock,
  ChevronLeft,
} from "lucide-react";
import RolesPage from "./ClientRolesPage";
import UsersPage from "./ClientUsersPage";
import OrdersPage from "./ClientOrdersPage";
import ServicesPage from "./ClientServicesPage";
import CatalogPage from "./ClientCatalogPage";
import ActivityPage from "./ClientActivityPage";
import ConfigurationPage from "./ClientConfigurationPage";
import ContractsPage from "./ClientContractsPage";
import DocumentsPage from "./ClientDocumentsPage";
import { getClients } from "@/lib/clientStore";

const tabs = ["Overview", "Roles", "Users", "Orders", "Services", "Contracts", "Catalog", "Activity", "Configuration", "Documents"];

const spendCategories = [
  { name: "Hardware", value: 45, amount: "$200,250", color: "#3b82f6" },
  { name: "Software", value: 30, amount: "$30,300", color: "#22c55e" },
  { name: "Service", value: 15, amount: "$15,300", color: "#f97316" },
  { name: "Other", value: 10, amount: "$10,500", color: "#a855f7" },
];

function generateMonthlySpend(seed: number) {
  const base = [18, 22, 19, 25, 21, 28, 32, 38, 45, 52, 58, 60];
  return base.map((v, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    value: Math.round(v * 1000 * (0.8 + ((seed * (i + 1)) % 40) / 100)),
  }));
}

function DonutChart({ categories, size }: { categories: typeof spendCategories; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.28;
  const total = categories.reduce((s, c) => s + c.value, 0);
  let angle = -Math.PI / 2;

  const slices = categories.map((cat) => {
    const sweep = (cat.value / total) * 2 * Math.PI;
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle + sweep);
    const y2 = cy + outerR * Math.sin(angle + sweep);
    const ix1 = cx + innerR * Math.cos(angle + sweep);
    const iy1 = cy + innerR * Math.sin(angle + sweep);
    const ix2 = cx + innerR * Math.cos(angle);
    const iy2 = cy + innerR * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
    angle += sweep;
    return { d, color: cat.color, name: cat.name };
  });

  return (
    <svg width={size} height={size}>
      {slices.map((s) => (
        <path key={s.name} d={s.d} fill={s.color} stroke="white" strokeWidth={1} />
      ))}
    </svg>
  );
}

function PlaceholderPage({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Construction size={28} className="text-blue-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{tab}</h2>
        <p className="text-sm text-gray-400 mt-1">This section is ready — data coming soon.</p>
      </div>
    </div>
  );
}

function NotFoundPage({ id }: { id: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <Building2 size={28} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Client not found</h2>
        <p className="text-sm text-gray-400 mt-1">No client with ID <span className="font-mono">{id}</span> exists.</p>
      </div>
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        <ChevronLeft size={14} /> Back to Clients
      </button>
    </div>
  );
}

export default function App() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const clients = getClients();
  const client = clients.find(c => c.id === clientId);

  if (!client) {
    return <NotFoundPage id={clientId || ""} />;
  }

  const initials = client.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const seed = client.id.replace(/\D/g, "").slice(-3);
  const seedNum = parseInt(seed || "1", 10);
  const monthlySpend = generateMonthlySpend(seedNum);
  const totalSpend = monthlySpend.reduce((s, m) => s + m.value, 0);

  const contractStart = client.contractStartDate
    ? new Date(client.contractStartDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "N/A";
  const contractEnd = client.contractEndDate
    ? new Date(client.contractEndDate)
    : null;
  const today = new Date();
  const daysLeft = contractEnd
    ? Math.max(0, Math.round((contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const contractProgress = contractEnd && client.contractStartDate
    ? Math.min(100, Math.round(
        ((today.getTime() - new Date(client.contractStartDate).getTime()) /
          (contractEnd.getTime() - new Date(client.contractStartDate).getTime())) * 100
      ))
    : 100;

  const isOverview = activeTab === "Overview";
  const address = [client.billingAddress, client.billingCity, client.billingState, client.billingPincode]
    .filter(Boolean)
    .join(", ") || "No address";

  const shippingAddress = [client.shipping_address || client.shippingAddress, client.shipping_city || client.shippingCity, client.shipping_state || client.shippingState, client.shipping_pincode || client.shippingPincode]
    .filter(Boolean)
    .join(", ") || null;

  function handleDownloadProfile() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 0;

    // Header band
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 42, "F");

    // Avatar circle
    doc.setFillColor(255, 255, 255);
    doc.circle(margin + 12, 21, 12, "F");
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(initials, margin + 12, 24.5, { align: "center" });

    // Client name & ID
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(client.name, margin + 30, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Client ID: ${client.id}`, margin + 30, 25);
    doc.text(`Status: ${(client.status || "N/A").toUpperCase()}`, margin + 30, 31);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, margin + 30, 37);

    y = 52;

    // Helper to draw a section heading
    function sectionHead(title: string) {
      doc.setFillColor(239, 246, 255);
      doc.rect(margin, y - 4, pageW - margin * 2, 8, "F");
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), margin + 2, y + 1);
      y += 7;
    }

    // Helper to draw a labeled value row (two-column layout)
    function row(label: string, value: string, x = margin, colW = pageW - margin * 2) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, y);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(value || "N/A", colW - 32);
      doc.text(lines, x + 32, y);
      y += 5.5 * lines.length;
    }

    // ── Basic Information ────────────────────────────────────────
    sectionHead("Basic Information");
    const halfW = (pageW - margin * 2) / 2;
    const rightX = margin + halfW + 4;

    // Left column
    const savedY = y;
    row("Company Name", client.name, margin, halfW);
    row("Category", client.category || client.client_category || "N/A", margin, halfW);
    row("Client Tier", client.tier || client.client_tier || "N/A", margin, halfW);
    row("Client Rep", client.rep || client.client_rep || "N/A", margin, halfW);
    const leftEndY = y;

    // Right column
    y = savedY;
    row("Email", client.email || "N/A", rightX, halfW);
    row("Phone", client.phone || "N/A", rightX, halfW);
    row("Mobile", client.mobile || "N/A", rightX, halfW);
    row("Website", client.website || "N/A", rightX, halfW);
    const rightEndY = y;

    y = Math.max(leftEndY, rightEndY) + 3;

    // ── Business Details ─────────────────────────────────────────
    sectionHead("Business Details");
    const b1Y = y;
    row("GST Number", client.gst_number || client.gstNumber || "N/A", margin, halfW);
    row("PAN Number", client.pan_number || client.panNumber || "N/A", margin, halfW);
    row("Currency", client.currency || client.preferred_currency || "N/A", margin, halfW);
    row("Industry", client.industry || "N/A", margin, halfW);
    const b1End = y;

    y = b1Y;
    row("Bank Name", client.bank_name || client.bankName || "N/A", rightX, halfW);
    row("Account No.", client.account_number || client.accountNumber || "N/A", rightX, halfW);
    row("IFSC Code", client.ifsc_code || client.ifscCode || "N/A", rightX, halfW);
    row("Branch", client.branch || "N/A", rightX, halfW);
    const b2End = y;

    y = Math.max(b1End, b2End) + 3;

    // ── Contract Details ──────────────────────────────────────────
    sectionHead("Contract Details");
    const c1Y = y;
    row("Contract Start", contractStart, margin, halfW);
    row("Days Remaining", daysLeft.toString(), margin, halfW);
    const c1End = y;

    y = c1Y;
    row("Contract End", contractEnd ? contractEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A", rightX, halfW);
    row("Progress", `${contractProgress}%`, rightX, halfW);
    const c2End = y;

    y = Math.max(c1End, c2End) + 3;

    // ── Address ───────────────────────────────────────────────────
    sectionHead("Address");
    const a1Y = y;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("BILLING ADDRESS", margin, y);
    y += 4;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const billingLines = doc.splitTextToSize(address, halfW - 4);
    doc.text(billingLines, margin, y);
    const a1End = y + 5.5 * billingLines.length;

    y = a1Y;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("SHIPPING ADDRESS", rightX, y);
    y += 4;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const shipLines = doc.splitTextToSize(shippingAddress || address, halfW - 4);
    doc.text(shipLines, rightX, y);

    y = Math.max(a1End, y + 5.5 * shipLines.length) + 3;

    // ── Notes ─────────────────────────────────────────────────────
    if (client.notes || client.client_notes) {
      sectionHead("Notes");
      const noteLines = doc.splitTextToSize(client.notes || client.client_notes, pageW - margin * 2);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(noteLines, margin, y);
      y += 5.5 * noteLines.length + 3;
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(37, 99, 235);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("NIDO Procurement Platform — Confidential", margin, pageH - 3.5);
    doc.text(`Page 1`, pageW - margin, pageH - 3.5, { align: "right" });

    doc.save(`${client.name.replace(/\s+/g, "_")}_Profile.pdf`);
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Page header */}
      <div className="px-6 pt-5 pb-0 flex items-center gap-2">
        <button
          onClick={() => navigate("/clients")}
          className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{client.name}</h1>
      </div>

      <div className="flex gap-0 p-4 pt-3 min-h-[calc(100vh-48px)]">
        {/* LEFT SIDEBAR — only on Overview */}
        {isOverview && sidebarVisible && (
          <aside className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 mr-4 h-fit relative">
            {/* Hide button */}
            <button
              onClick={() => setSidebarVisible(false)}
              title="Hide panel"
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500 flex items-center justify-center bg-white overflow-hidden">
                {client.client_logo_url ? (
                  <img
                    src={client.client_logo_url}
                    alt={`${client.name} logo`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-blue-600 font-bold text-lg">{initials}</span>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                <p className="text-xs text-gray-500">{client.tier || "Client"} • Since {contractStart}</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{client.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span>{client.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span>{client.contractEndDate ? new Date(client.contractEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Mail size={12} /> Email
                </a>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Mail size={12} /> Email
                </button>
              )}
              {client.phone ? (
                <a
                  href={`tel:${client.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Phone size={12} /> Call
                </a>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Phone size={12} /> Call
                </button>
              )}
            </div>

            {/* Contract Progress */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-600">Contract Progress</span>
                <span className="text-xs text-gray-500">{daysLeft} days left</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${contractProgress}%` }} />
              </div>
            </div>

            {/* Client meta */}
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-gray-500">Client Since</p>
                <p className="font-medium text-gray-800">{contractStart}</p>
              </div>
              <div>
                <p className="text-gray-500">Client ID</p>
                <p className="font-medium text-gray-800">{client.id}</p>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownloadProfile}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Download size={13} />
              Download Profile
            </button>
          </aside>
        )}

        {/* Show sidebar button — visible when sidebar is hidden */}
        {isOverview && !sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            title="Show panel"
            className="mr-3 mt-1 w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors self-start"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Stats row — only on Overview */}
          {isOverview && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">—</p>
                    <p className="text-xs text-gray-400 mt-0.5">Managed under {client.name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <DollarSign size={16} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spends</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">${totalSpend.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Year to date</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <ShoppingCart size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open Orders</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">—</p>
                    <p className="text-xs text-gray-400 mt-0.5">Active contracts</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 px-4">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Non-overview tab content */}
          {!isOverview && (
            <div className="bg-white rounded-xl border border-gray-200 flex-1">
              {activeTab === "Roles" ? <RolesPage />
                : activeTab === "Users" ? <UsersPage />
                : activeTab === "Orders" ? <OrdersPage />
                : activeTab === "Services" ? <ServicesPage />
                : activeTab === "Contracts" ? <ContractsPage contractId={""} contractTitle={""} onBack={() => setActiveTab("Overview")} />
                : activeTab === "Catalog" ? <CatalogPage clientId={clientId || "CLI-DEFAULT"} />
                : activeTab === "Activity" ? <ActivityPage />
                : activeTab === "Configuration" ? <ConfigurationPage clientId={clientId || "CLI-DEFAULT"} />
                : activeTab === "Documents" ? <DocumentsPage />
                : <PlaceholderPage tab={activeTab} />}
            </div>
          )}

          {/* Overview panels */}
          {isOverview && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {/* Company Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Company Details</h3>
                  <div className="flex flex-col gap-3 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400 shrink-0" />
                      <span>{client.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span>{client.category || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400 shrink-0" />
                      <span>{client.tier ? `${client.tier} tier` : "—"}</span>
                    </div>
                    {client.website && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400">Website</span>
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-gray-400 shrink-0" />
                          <a href={client.website.startsWith("http") ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">{client.website}</a>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Phone</span>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span>{client.phone || "—"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Billing Email</span>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        {client.email ? (
                          <a href={`mailto:${client.email}`} className="text-blue-500 hover:underline truncate">{client.email}</a>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spending Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Spending Overview</h3>
                    <span className="text-xs border border-gray-200 rounded-md px-2 py-0.5 text-gray-500">This Year</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${totalSpend.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mb-1">Total Spend</p>
                  <p className="text-xs text-green-500 font-medium mb-3">+12.5% vs last year</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={monthlySpend} barSize={10} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Spend Categories */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Spend Categories</h3>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <DonutChart categories={spendCategories} size={100} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {spendCategories.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-gray-600">{cat.name} {cat.value}%</span>
                          </div>
                          <span className="text-gray-800 font-medium">{cat.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-3 gap-4">
                {/* User Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">User Summary</h3>
                    </div>
                    <button onClick={() => setActiveTab("Users")} className="hover:text-blue-500 transition-colors">
                      <ChevronRight size={15} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <Users size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">—</p>
                      <p className="text-xs text-gray-400">Total Users</p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">Recent Orders</h3>
                    </div>
                    <button onClick={() => setActiveTab("Orders")} className="hover:text-blue-500 transition-colors">
                      <ChevronRight size={15} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <ShoppingCart size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">—</p>
                      <p className="text-xs text-gray-400">Open Orders</p>
                    </div>
                  </div>
                </div>

                {/* Active Services */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">Active Services</h3>
                    </div>
                    <button onClick={() => setActiveTab("Contracts")} className="hover:text-blue-500 transition-colors">
                      <ChevronRight size={15} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <FileText size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">—</p>
                      <p className="text-xs text-gray-400">Active Contracts</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-xl font-bold text-blue-500">{daysLeft} days</p>
                      <p className="text-xs text-gray-400">Until Renewal</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
