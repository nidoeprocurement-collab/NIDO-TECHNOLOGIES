import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Settings,
  FileText,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

const ClientDetailPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showMenu, setShowMenu] = useState(false);
  const [showRolesMenu, setShowRolesMenu] = useState(false);
  const [userFilter, setUserFilter] = useState("all");

  const client = {
    id: "CLI-001",
    name: "veera industries",
    logo: "VI",
    email: "Veeru@indu.com",
    phone: "9784516847",
    website: "www.veeraindustries.com",
    category: "Technology",
    employees: "51-200",
    totalUsers: 24,
    activeUsers: 12,
    pendingInvites: 3,
    inactiveUsers: 0,
    totalSpend: 101000,
    openOrders: 3,
    activeServices: 2,
    contractStart: "Jun 2026",
    clientSince: "Jun 2026",
    clientId: "CLI-00023",
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
    { id: "ORD-2024-1187", date: "2024-05-10", items: "15 items", amount: "$89,000", vendor: "TechSupply Co", status: "Delivered" },
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
    alert("Download Profile PDF - Feature implementation");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/clients")} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-gray-600">Clients / {client.name}</p>
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Mail size={16} /> Email
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Phone size={16} /> Call
                  </button>
                  <button onClick={downloadProfile} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Download size={16} /> Download Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 overflow-x-auto border-t pt-4">
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
                className={`px-4 py-2 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-fit">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-blue-600">{client.logo}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                <p className="text-sm text-gray-600">Premium Client • Since {client.contractStart}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-700">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-700">{client.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={16} className="text-gray-400" />
                  <span className="text-gray-700">{client.website}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100">
                  <Mail size={16} className="inline mr-2" /> Email
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200">
                  <Phone size={16} className="inline mr-2" /> Call
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Contract Progress</span>
                  <span className="text-gray-900 font-medium">0 days left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-600">Client Since</p>
                  <p className="font-semibold text-gray-900">{client.clientSince}</p>
                </div>
                <div>
                  <p className="text-gray-600">Client ID</p>
                  <p className="font-semibold text-gray-900">{client.clientId}</p>
                </div>
              </div>

              <button onClick={downloadProfile} className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 flex items-center justify-center gap-2">
                <Download size={16} /> Download Profile
              </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Company Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company Name</span>
                    <span className="font-medium text-gray-900">{client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-gray-900">{client.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employees</span>
                    <span className="font-medium text-gray-900">{client.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Website</span>
                    <span className="font-medium text-blue-600">{client.website}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Spending Overview</h3>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option>This Year</option>
                  </select>
                </div>
                <div className="text-3xl font-bold text-gray-900">${client.totalSpend.toLocaleString()}</div>
                <p className="text-sm text-green-600">+12.5% vs last year</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <Users size={20} className="text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{client.totalUsers}</p>
                  <p className="text-xs text-gray-600">Total Users</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <ShoppingCart size={20} className="text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{client.openOrders}</p>
                  <p className="text-xs text-gray-600">Open Orders</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <Package size={20} className="text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{client.activeServices}</p>
                  <p className="text-xs text-gray-600">Active Services</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Users</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={16} /> Add Users
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Export Users
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Import Users
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Download Template
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {[
                  { id: "all", label: "Total Users", count: client.totalUsers },
                  { id: "pending", label: "Pending", count: client.pendingInvites },
                  { id: "inactive", label: "Inactive", count: client.inactiveUsers },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setUserFilter(filter.id)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Role-Based Access Control (RBAC)</h3>
              <p className="text-sm text-blue-800">
                Roles determine what users in this client can access and do in the system. Each role has specific permissions across modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockRoles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600 mt-1">View and manage all orders placed by this client.</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Service History</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2">
                <Plus size={16} /> Add Service
              </button>
            </div>

            <div className="p-6 border-b flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Filter size={16} /> Filter
              </button>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <option>Category</option>
              </select>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">3</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">0</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">0</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <input type="text" placeholder="Search by product name, SKU, brand..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Bulk Import</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Export</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add New Product</button>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">SELLING PRICE (INR)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">AVAILABILITY</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCatalog.map((item) => (
                    <tr key={item.sku} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.sku}</td>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                    {activity.type === "contract" && <FileText size={20} className="text-blue-600" />}
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
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
