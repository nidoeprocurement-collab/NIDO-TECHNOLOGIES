import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const ClientDetailPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showMenu, setShowMenu] = useState(false);
  const [showRolesMenu, setShowRolesMenu] = useState(false);
  const [userFilter, setUserFilter] = useState("total");
  const pdfRef = useRef(null);

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
    inactiveUsers: 0,
    totalSpend: 101000,
    lastPayment: 25000,
    openOrders: 3,
    orderValue: 32500,
    activeServices: 2,
    daysUntilRenewal: 0,
    contractStart: "Jun 2026",
    clientSince: "Jun 2026",
    clientId: "CLI-00023",
    billingAddress: "Mumbai, Maharashtra",
    contractStatus: "active",
    daysRemaining: 69,
  };

  const mockUsers = [
    {
      id: "4dfca191-a84f-459f-9bb5-525ceda333b",
      name: "lok",
      role: "Accounts Payable",
      email: "lok@gmail.com",
      phone: "9784547852",
      lastActive: "2026-06-10T11:57:33",
      status: "Active",
    },
    {
      id: "3c57dbe1-7fc7-4a0c-a8bd-8c8600298457",
      name: "ramesh",
      role: "Accounts Payable",
      email: "rame@info.com",
      phone: "8124785478",
      lastActive: "2026-06-10T11:51:13",
      status: "Active",
    },
  ];

  const mockRoles = [
    { id: 1, name: "System Owner", type: "Internal User", desc: "Full platform access", visibility: "All", approve: "Yes", limit: "₹999,999" },
    { id: 2, name: "Administrator", type: "Internal User", desc: "Full internal access", visibility: "All", approve: "Yes", limit: "₹500,000" },
    { id: 3, name: "Procurement Manager", type: "Internal User", desc: "Purchase orders", visibility: "All", approve: "Yes", limit: "₹250,000" },
  ];

  const mockOrders = [
    { id: "ORD-2024-1245", date: "2024-05-28", items: "12 items", amount: "$125,000", vendor: "TechSupply Co", status: "Delivered" },
    { id: "ORD-2024-1233", date: "2024-05-20", items: "8 items", amount: "$45,000", vendor: "Office Essentials", status: "In Transit" },
  ];

  const mockServices = [
    { id: "SRV-001", name: "Cloud Hosting Premium", provider: "CloudServe Inc", date: "2024-01-01", amount: "$12,000/year", status: "Active" },
    { id: "SRV-002", name: "IT Support", provider: "TechSupply Co", date: "2024-01-01", amount: "$24,000/year", status: "Active" },
  ];

  const mockCatalog = [
    { sku: "PRD-001", product: "Dell Laptop XPS 15", category: "Hardware", roles: ["Admin", "IT"], price: "₹21,004", avail: "In Stock" },
  ];

  const mockActivity = [
    { id: 1, type: "order", title: "New order placed", desc: "Order #ORD-2024-1245", date: "2024-05-28" },
    { id: 2, type: "user", title: "User added", desc: "Aaron Lee added", date: "2024-05-25" },
  ];

  const generateProfilePDF = async () => {
    if (pdfRef.current) {
      try {
        const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        const imgWidth = width;
        const imgHeight = (canvas.height * width) / canvas.width;
        
        let position = 0;
        let heightLeft = imgHeight;
        
        const imgData = canvas.toDataURL("image/png");
        while (heightLeft > 0) {
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= height;
          position -= height;
          if (heightLeft > 0) pdf.addPage();
        }
        pdf.save(`${client.name}-profile.pdf`);
      } catch (error) {
        console.error("PDF error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/clients")} className="text-gray-600 hover:text-gray-900">
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-gray-600">Clients / {client.name}</span>
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Mail size={16} /> Email
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Phone size={16} /> Call
                  </button>
                  <button onClick={generateProfilePDF} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Download size={16} /> Download Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">{client.name}</h1>

          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-blue-600" />
                <span className="text-xs text-gray-600 font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{client.totalUsers}</p>
              <p className="text-xs text-gray-600 mt-1">{client.activeUsers} Active</p>
              <p className="text-xs text-gray-600">{client.pendingInvites} Pending Invites</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={18} className="text-green-600" />
                <span className="text-xs text-gray-600 font-medium">Total Spends</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${(client.totalSpend / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-600 mt-1">Year to date</p>
              <p className="text-xs text-gray-600">Last Payment: ${(client.lastPayment / 1000).toFixed(0)}k</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={18} className="text-orange-600" />
                <span className="text-xs text-gray-600 font-medium">Open Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{client.openOrders}</p>
              <p className="text-xs text-gray-600 mt-1">${(client.orderValue / 1000).toFixed(0)}k value</p>
              <p className="text-xs text-gray-600">Contracts</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-t pt-4 overflow-x-auto">
            {["Overview", "Roles", "Users", "Orders", "Services", "Catalog", "Activity", "Configuration"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-1 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.toLowerCase()
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === "overview" && (
          <div ref={pdfRef} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Client Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{client.logo}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
                  <p className="text-xs text-gray-600 mt-1">Premium Client • Since 2026</p>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{client.email}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{client.phone}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Globe size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{client.address}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">N/A</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100">
                    <Mail size={14} className="inline mr-1" /> Email
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200">
                    <Phone size={14} className="inline mr-1" /> Call
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-600">Contract Progress</span>
                    <span className="font-medium text-gray-900">{client.daysRemaining} days left</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-xs border-t pt-4">
                  <div>
                    <p className="text-gray-600">Client Space</p>
                    <p className="font-semibold text-gray-900">{client.clientSince}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Client ID</p>
                    <p className="font-semibold text-gray-900">{client.clientId}</p>
                  </div>
                </div>

                <button onClick={generateProfilePDF} className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 flex items-center justify-center gap-2">
                  <Download size={16} /> Download Profile
                </button>
              </div>
            </div>

            {/* Right Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Company Details & Spending Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Company Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">veera industries</span>
                      <span className="font-medium text-gray-900">●</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Technology</span>
                      <span className="font-medium text-gray-900">●</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">51-200 employees</span>
                      <span className="font-medium text-gray-900">●</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Website</span>
                      <a href="#" className="text-blue-600 hover:underline">{client.website}</a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium text-gray-900">{client.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Email</span>
                      <span className="text-blue-600 text-xs">{client.billingEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Spending Overview</h3>
                    <button className="text-sm text-gray-600 hover:text-gray-900">This Year</button>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">${(client.totalSpend / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-green-600 mt-1">+12.5% vs last year</p>
                  <div className="mt-4 h-32 bg-gradient-to-b from-blue-50 to-transparent rounded flex items-end justify-around px-2 py-4">
                    {[40, 60, 50, 70, 55, 65, 75, 80, 70, 65, 75, 85].map((h, i) => (
                      <div key={i} className="bg-blue-600 rounded-t" style={{ height: `${(h / 100) * 100}%`, width: "6px" }}></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Top Spend Categories</h3>
                  <div className="flex items-center gap-8">
                    <div className="w-40 h-40 rounded-full bg-gradient-conic from-blue-500 via-green-500 to-yellow-500 relative">
                      <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                        <span className="text-center">
                          <p className="text-xs text-gray-600">Total</p>
                          <p className="font-bold text-gray-900">$101k</p>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Hardware 45%</span>
                        <span className="font-semibold">$200,250</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Software 30%</span>
                        <span className="font-semibold">$30,300</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Service 15%</span>
                        <span className="font-semibold">$15,300</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>Other 10%</span>
                        <span className="font-semibold">$10,500</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Users size={16} /> User Summary
                      </h4>
                      <ChevronLeft size={16} className="text-gray-400" />
                    </div>
                    <div className="flex items-end gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{client.totalUsers}</p>
                        <p className="text-xs text-gray-600">Total Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{client.activeUsers}</p>
                        <p className="text-xs text-gray-600">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{client.pendingInvites}</p>
                        <p className="text-xs text-gray-600">Inactive</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <ShoppingCart size={16} /> Recent Orders
                      </h4>
                      <ChevronLeft size={16} className="text-gray-400" />
                    </div>
                    <div className="flex items-end gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{client.openOrders}</p>
                        <p className="text-xs text-gray-600">Open Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">${(client.orderValue / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-gray-600">Total Value</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Package size={16} /> Active Services
                      </h4>
                      <ChevronLeft size={16} className="text-gray-400" />
                    </div>
                    <div className="flex items-end gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{client.activeServices}</p>
                        <p className="text-xs text-gray-600">Active Contracts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{client.daysUntilRenewal}</p>
                        <p className="text-xs text-gray-600">Until Renewal</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Users</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={16} /> Add Users
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                {[
                  { id: "total", label: "Total Users", count: client.totalUsers },
                  { id: "pending", label: "Pending", count: client.pendingInvites },
                  { id: "inactive", label: "Inactive", count: client.inactiveUsers },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setUserFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      userFilter === filter.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-700"
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-blue-600">{user.id}</td>
                      <td className="px-6 py-4 text-sm"><p className="font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-600">{user.role}</p></td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.phone}</td>
                      <td className="px-6 py-4 text-sm"><span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">{user.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Roles Management</h3>
              <div className="relative">
                <button onClick={() => setShowRolesMenu(!showRolesMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical size={20} />
                </button>
                {showRolesMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{role.name}</h4>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mt-1">{role.type}</span>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded"><Edit size={16} /></button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{role.desc}</p>
                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex justify-between"><span className="text-gray-600">Data Visibility:</span><span className="font-medium">{role.visibility}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Can Approve:</span><span className="font-medium text-green-600">{role.approve}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Approval Limit:</span><span className="font-medium text-blue-600">{role.limit}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600 mt-1">All orders for this client</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> New Order
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
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
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Service History</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Service
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">AMOUNT</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockServices.map((svc) => (
                    <tr key={svc.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{svc.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{svc.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{svc.provider}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{svc.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{svc.amount}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">{svc.status}</span>
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">3</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">0</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">0</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Bulk Import</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Export</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Product</button>
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
                  {mockCatalog.map((c) => (
                    <tr key={c.sku} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{c.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{c.product}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{c.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{c.roles.join(", ")}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.price}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">{c.avail}</span>
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
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Recent Activity</h3>
              <p className="text-sm text-gray-600 mb-6">Latest updates for this client</p>
              <div className="space-y-6">
                {mockActivity.map((a) => (
                  <div key={a.id} className="flex gap-4 pb-6 border-b last:border-b-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{a.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{a.desc}</p>
                      <p className="text-xs text-gray-500 mt-2">{a.date}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                  <input type="password" value="••••••••••••" readOnly className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Regenerate API Key</button>
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
              <button className="px-4 py-2 border border-red-300 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">Archive Client</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
