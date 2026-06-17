import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import {
  ChevronLeft,
  MoreVertical,
  Download,
  Phone,
  Mail,
  Globe,
  Users,
  ShoppingCart,
  Package,
  Plus,
  Filter,
  Edit,
} from "lucide-react";

const ClientDetailPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showMenu, setShowMenu] = useState(false);
  const [showRolesMenu, setShowRolesMenu] = useState(false);
  const [userFilter, setUserFilter] = useState("total");

  const client = {
    id: "CLI-001",
    name: "veera industries",
    logo: "VI",
    email: "Veeru@indu.com",
    phone: "9784516847",
    address: "No address",
    website: "www.veeraindustries.com",
    category: "Technology",
    employees: "51-200 employees",
    billingEmail: "Veeru@indu.com",
    totalUsers: 24,
    activeUsers: 12,
    pendingInvites: 3,
    totalSpend: 101000,
    lastPayment: 25000,
    openOrders: 3,
    orderValue: 32500,
    activeServices: 2,
    daysUntilRenewal: 0,
    contractStart: "Jun 2026",
    clientSince: "Jun 2026",
    clientId: "CLI-00023",
    contractStatus: "active",
    daysRemaining: 69,
    industry: "Technology",
    businessType: "Registered",
    gst: "18AABCT1234H1Z0",
    pan: "ABCD12345EF",
    paymentTerms: "Due on Receipt",
    contractType: "Prepaid",
    pricingTier: "Premium",
  };

  const mockUsers = [
    {
      id: "4dfca191-a84f-459f-9bb5-525ceda333b",
      name: "lok",
      role: "Accounts Payable",
      email: "lok@gmail.com",
      phone: "9784547852",
      lastActive: "2026-06-10T11:57:33.2022",
      status: "Active",
    },
    {
      id: "3c57dbe1-7fc7-4a0c-a8bd-8c8600298457",
      name: "ramesh",
      role: "Accounts Payable",
      email: "rame@info.com",
      phone: "8124785478",
      lastActive: "2026-06-10T11:51:13.659Z",
      status: "Active",
    },
  ];

  const mockRoles = [
    {
      id: 1,
      name: "System Owner",
      type: "Internal User",
      description: "Full platform access with all permissions",
      dataVisibility: "All",
      canApprove: "Yes",
      approvalLimit: "₹999,999",
    },
    {
      id: 2,
      name: "Administrator",
      type: "Internal User",
      description: "Full access to internal operations",
      dataVisibility: "All",
      canApprove: "Yes",
      approvalLimit: "₹500,000",
    },
    {
      id: 3,
      name: "Procurement Manager",
      type: "Internal User",
      description: "Manage purchase orders and vendor relationships",
      dataVisibility: "All",
      canApprove: "Yes",
      approvalLimit: "₹250,000",
    },
  ];

  const mockOrders = [
    { id: "ORD-2024-1245", date: "2024-05-28", items: "12 items", amount: "$125,000", vendor: "TechSupply Co", status: "Delivered" },
    { id: "ORD-2024-1233", date: "2024-05-20", items: "8 items", amount: "$45,000", vendor: "Office Essentials", status: "In Transit" },
    { id: "ORD-2024-1198", date: "2024-05-15", items: "5 items", amount: "$22,000", vendor: "CloudServe Inc", status: "Delivered" },
  ];

  const mockServices = [
    { id: "SRV-001", name: "Cloud Hosting Premium", provider: "CloudServe Inc", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$12,000/year", status: "Active" },
    { id: "SRV-002", name: "IT Support & Maintenance", provider: "TechSupply Co", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$24,000/year", status: "Active" },
    { id: "SRV-003", name: "Software Licenses", provider: "Microsoft", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$36,000/year", status: "Active" },
  ];

  const mockCatalog = [
    { sku: "PRD-001", product: "Dell Laptop XPS 15", category: "Hardware", roles: ["Admin", "IT Manager"], price: "₹21,004", availability: "In Stock" },
    { sku: "PRD-002", product: "Microsoft Office 365", category: "Software", roles: ["IT Manager", "Finance"], price: "₹83,375", availability: "In Stock" },
    { sku: "PRD-003", product: "Ergonomic Office Chair", category: "Accessories", roles: ["IT Staff", "Support"], price: "₹1,740", availability: "In Stock" },
  ];

  const mockActivities = [
    { id: 1, type: "order", title: "New order placed", description: "Order #ORD-2024-1245 for $125,000", date: "2024-05-28 20:30 AM" },
    { id: 2, type: "user", title: "User added", description: "Aaron Lee (EMP-001) added as Admin", date: "2024-05-25 02:15 PM" },
    { id: 3, type: "contract", title: "Contract updated", description: "Contract period extended to Dec 2025", date: "2024-05-20 11:00 AM" },
  ];

  const downloadProfile = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Header with logo/initials
    pdf.setFontSize(24);
    pdf.setFont(undefined, "bold");
    pdf.text(client.logo, margin, yPos);
    yPos += 8;

    pdf.setFontSize(14);
    pdf.text(client.name, margin, yPos);
    yPos += 5;

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    pdf.text(`${client.pricingTier} Client • Since ${client.contractStart}`, margin, yPos);
    yPos += 12;

    // Contact Information
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.text("Contact Information", margin, yPos);
    yPos += 7;

    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    pdf.text(`Email: ${client.email}`, margin, yPos);
    yPos += 5;
    pdf.text(`Phone: ${client.phone}`, margin, yPos);
    yPos += 5;
    pdf.text(`Address: ${client.address}`, margin, yPos);
    yPos += 5;
    pdf.text(`Contract Period: ${client.contractStart} - ${client.contractStart}`, margin, yPos);
    yPos += 12;

    // Business Details
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.text("Business Details", margin, yPos);
    yPos += 7;

    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    const businessDetails = [
      [`Client ID: ${client.clientId}`],
      [`Industry: ${client.industry}`],
      [`Business Type: ${client.businessType}`],
      [`GST: ${client.gst}`],
      [`PAN: ${client.pan}`],
      [`Payment Terms: ${client.paymentTerms}`],
      [`Contract Type: ${client.contractType}`],
      [`Pricing Tier: ${client.pricingTier}`],
    ];

    businessDetails.forEach(([text]) => {
      pdf.text(text, margin, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Contract Status
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.text("Contract Status", margin, yPos);
    yPos += 7;

    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    pdf.text(`Days Remaining: ${client.daysRemaining} days`, margin, yPos);
    yPos += 5;
    pdf.text(`Status: ${client.contractStatus}`, margin, yPos);
    yPos += 5;
    pdf.text(`Total Orders: ${client.openOrders}`, margin, yPos);
    yPos += 12;

    // Footer
    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");
    const generatedDate = new Date().toLocaleDateString();
    pdf.text(`Generated on ${generatedDate}`, margin, pageHeight - 10);

    // Platform footer
    pdf.setFontSize(7);
    pdf.setFont(undefined, "bold");
    pdf.text("Nido-Tech Procurement Platform", pageWidth / 2, pageHeight - 5, { align: "center" });

    pdf.save(`${client.name}-profile.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate("/clients")} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="text-sm text-gray-600">Clients / {client.name}</p>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            </div>
          </div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-blue-600" />
                <p className="text-xs font-semibold text-gray-600">Total Users</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{client.totalUsers}</p>
              <p className="text-xs text-gray-500">{client.activeUsers} Active</p>
              <p className="text-xs text-gray-500">{client.pendingInvites} Pending Invites</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={18} className="text-green-600" />
                <p className="text-xs font-semibold text-gray-600">Total Spends</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">${(client.totalSpend / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Year to date</p>
              <p className="text-xs text-gray-500">Last Payment: ${client.lastPayment / 1000}K</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={18} className="text-orange-600" />
                <p className="text-xs font-semibold text-gray-600">Open Orders</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{client.openOrders}</p>
              <p className="text-xs text-gray-500">${client.orderValue / 1000}K value</p>
              <p className="text-xs text-gray-500">Contracts</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-t pt-4">
            {[
              { id: "overview", label: "Overview" },
              { id: "roles", label: "Roles" },
              { id: "users", label: "Users" },
              { id: "orders", label: "Orders" },
              { id: "services", label: "Services" },
              { id: "catalog", label: "Catalog" },
              { id: "activity", label: "Activity" },
              { id: "configuration", label: "Configuration" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-4 gap-6">
            {/* Left Sidebar - Client Card */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">{client.logo}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                  <p className="text-xs text-gray-600">{client.pricingTier} Client • Since {client.contractStart}</p>
                </div>

                <div className="space-y-3 mb-4 text-sm border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-700 text-xs">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-700 text-xs">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-gray-700 text-xs">{client.website}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100">
                    Email
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200">
                    Call
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-600">Contract Progress</span>
                    <span className="font-semibold text-gray-900">0 days left</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs border-b pb-4">
                  <div>
                    <p className="text-gray-600">Client Since</p>
                    <p className="font-semibold text-gray-900">{client.clientSince}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Client ID</p>
                    <p className="font-semibold text-gray-900">{client.clientId}</p>
                  </div>
                </div>

                <button
                  onClick={downloadProfile}
                  className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded text-xs font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                >
                  <Download size={14} /> Download Profile
                </button>
              </div>
            </div>

            {/* Right Content - Main Area */}
            <div className="col-span-3 space-y-6">
              {/* Company Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Company Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" />
                    <div>
                      <p className="text-gray-600 text-xs">Company Name</p>
                      <p className="font-medium text-gray-900">{client.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-600" />
                    <div>
                      <p className="text-gray-600 text-xs">Category</p>
                      <p className="font-medium text-gray-900">{client.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <div>
                      <p className="text-gray-600 text-xs">Employees</p>
                      <p className="font-medium text-gray-900">{client.employees}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" />
                    <div>
                      <p className="text-gray-600 text-xs">Website</p>
                      <p className="font-medium text-blue-600 text-xs">{client.website}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spending Overview & Top Categories */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Spending Overview</h3>
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>This Year</option>
                    </select>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">${(client.totalSpend / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-600 mt-1">+12.5% vs last year</p>
                  <div className="mt-4 h-24 bg-gray-100 rounded flex items-end justify-around px-2">
                    {[65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120].map((h, i) => (
                      <div key={i} className="bg-blue-600 rounded-t" style={{ height: `${h}%`, width: "6px" }}></div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top Spend Categories</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 rounded-full" style={{
                        background: "conic-gradient(rgb(59, 130, 246) 0deg 162deg, rgb(34, 197, 94) 162deg 270deg, rgb(251, 146, 60) 270deg 324deg, rgb(139, 92, 246) 324deg 360deg)",
                      }}></div>
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">45%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-700">Hardware</span>
                      </div>
                      <span className="font-semibold">45% $200,250</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-gray-700">Software</span>
                      </div>
                      <span className="font-semibold">30% $30,300</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700">Service</span>
                      </div>
                      <span className="font-semibold">15% $15,300</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="text-gray-700">Other</span>
                      </div>
                      <span className="font-semibold">10% $10,500</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Users size={20} className="text-blue-600 mb-2" />
                      <p className="text-xs text-gray-600 mb-1">User Summary</p>
                      <p className="text-2xl font-bold text-gray-900">{client.totalUsers}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                  <div className="flex gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-gray-600">{client.activeUsers}</p>
                      <p className="text-green-600 font-semibold">Active</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{client.pendingInvites}</p>
                      <p className="text-orange-600 font-semibold">Inactive</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <ShoppingCart size={20} className="text-blue-600 mb-2" />
                      <p className="text-xs text-gray-600 mb-1">Recent Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{client.openOrders}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-bold text-gray-900">${client.orderValue / 1000}K</p>
                    <p className="text-xs text-gray-600">Total Value</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Package size={20} className="text-blue-600 mb-2" />
                      <p className="text-xs text-gray-600 mb-1">Active Services</p>
                      <p className="text-2xl font-bold text-gray-900">{client.activeServices}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-bold text-gray-900">{client.daysUntilRenewal}</p>
                    <p className="text-xs text-gray-600">Until Renewal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Users</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={16} /> Add Users
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50">
                    Export Users
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {[
                  { id: "total", label: "Total Users", count: client.totalUsers },
                  { id: "pending", label: "Pending", count: client.pendingInvites },
                  { id: "inactive", label: "Inactive", count: client.inactiveUsers || 0 },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setUserFilter(filter.id)}
                    className={`px-4 py-3 rounded text-sm font-medium transition-colors ${
                      userFilter === filter.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">USER ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">NAME / ROLE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">EMAIL</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">PHONE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">LAST ACTIVE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-blue-600 font-medium">{user.id}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-600">{user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.lastActive}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{user.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Roles Management</h2>
              <div className="relative">
                <button onClick={() => setShowRolesMenu(!showRolesMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical size={20} />
                </button>
                {showRolesMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Plus size={16} /> Add Role
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              {mockRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{role.type}</span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Edit size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Visibility:</span>
                      <span className="font-medium text-gray-900">{role.dataVisibility}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Can Approve:</span>
                      <span className="font-medium text-green-600">{role.canApprove}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approval Limit:</span>
                      <span className="font-medium text-blue-600">{role.approvalLimit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600 mt-1">View and manage all orders placed by this client.</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                <Plus size={16} className="inline mr-2" /> New Order
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">ORDER ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">ITEMS</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">AMOUNT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">VENDOR</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.items}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.amount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.vendor}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Service History</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                <Plus size={16} className="inline mr-2" /> Add Service
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">SERVICE ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">SERVICE NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">PROVIDER</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">START DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">END DATE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">AMOUNT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockServices.map((service) => (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{service.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{service.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{service.provider}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{service.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{service.endDate}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{service.amount}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{service.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Items", value: "3", color: "bg-gray-100" },
                  { label: "In Stock", value: "3", color: "bg-green-100" },
                  { label: "Low Stock", value: "0", color: "bg-yellow-100" },
                  { label: "Out of Stock", value: "0", color: "bg-red-100" },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Bulk Import
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Export
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                  Add New Product
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">PRODUCT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">CATEGORY</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">ROLES</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">PRICE</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">AVAILABILITY</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCatalog.map((item) => (
                    <tr key={item.sku} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.product}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.category}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-1 flex-wrap">
                          {item.roles.map((role) => (
                            <span key={role} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {role} ×
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.price}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{item.availability}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600 mt-1">View the latest updates and actions for this client.</p>
            </div>

            <div className="p-6 space-y-6">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-6 border-b last:border-b-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {activity.type === "order" && <ShoppingCart size={20} className="text-blue-600" />}
                    {activity.type === "user" && <Users size={20} className="text-blue-600" />}
                    {activity.type === "contract" && <Package size={20} className="text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "configuration" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">API Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <div className="flex gap-2">
                  <input type="password" value="••••••••••••" readOnly className="flex-1 px-4 py-2 border border-gray-300 rounded bg-gray-50 text-gray-700" />
                  <button className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Regenerate API Key
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Email notifications for orders</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Email notifications for services</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-gray-700">SMS notifications</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
              <button className="px-4 py-2 border border-red-300 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100">
                Archive Client
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
