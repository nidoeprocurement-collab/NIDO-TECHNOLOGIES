'use client';

import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  MoreVertical, 
  Plus,
  Download,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  ShoppingCart,
  Briefcase,
  Activity,
  Settings,
  Archive,
  Edit,
  Eye,
  TrendingUp,
  Clock,
  Package
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Mock data for the client
const mockClientData = {
  'CLI-001': {
    id: 'CLI-001',
    client_id: 'CLI-00023',
    name: 'veera industries',
    company_name: 'veera industries',
    subtitle: 'Premium Client • Since 2026',
    email: 'Veeru@indu.com',
    phone: '9784515647',
    address: 'No address',
    website: 'www.veeraindustries.com',
    logo: 'VI',
    total_users: 24,
    active_users: 12,
    pending_users: 3,
    inactive_users: 4,
    total_spends: 101000,
    last_payment: 25000,
    last_payment_date: 'Jan 11, 2026',
    open_orders: 3,
    order_value: 32500,
    contract_status: 'contracts',
    contract_progress: 0,
    client_since: 'Jun 2026',
    category: 'Technology',
    employees: '51-200 employees',
    billing_email: 'Veeru@indu.com',
  }
};

// Mock data for tabs
const mockUsers = [
  { id: 1, name: 'John Doe', role: 'Admin', email: 'john@veera.com', phone: '9876543210', lastActive: '2 hours ago', status: 'active' },
  { id: 2, name: 'Jane Smith', role: 'Manager', email: 'jane@veera.com', phone: '9876543211', lastActive: '5 hours ago', status: 'active' },
  { id: 3, name: 'Mike Johnson', role: 'User', email: 'mike@veera.com', phone: '9876543212', lastActive: 'Pending', status: 'pending' },
];

const mockRoles = [
  { id: 1, name: 'System Owner', permissions: 'Full Access', users: 1 },
  { id: 2, name: 'Administrator', permissions: 'Admin Access', users: 2 },
  { id: 3, name: 'Procurement Manager', permissions: 'Procurement Access', users: 5 },
];

const mockOrders = [
  { id: 'ORD-001', date: '2026-01-15', items: 5, amount: '$12,500', vendor: 'Tech Supplies Co', status: 'Delivered' },
  { id: 'ORD-002', date: '2026-01-10', items: 3, amount: '$8,750', vendor: 'Global Parts Ltd', status: 'In Transit' },
  { id: 'ORD-003', date: '2026-01-05', items: 7, amount: '$11,250', vendor: 'Industry Solutions', status: 'Delivered' },
];

const mockServices = [
  { id: 'SVC-001', name: 'Premium Support', provider: 'Tech Support Inc', date: '2026-01-01', amount: '$5,000', status: 'Active' },
  { id: 'SVC-002', name: 'Maintenance', provider: 'System Maintenance Ltd', date: '2025-12-01', amount: '$3,500', status: 'Active' },
];

const mockCatalog = [
  { sku: 'SKU-001', product: 'Component A', category: 'Electronics', roles: ['Admin', 'Manager'], price: '$500', avail: 'In Stock' },
  { sku: 'SKU-002', product: 'Component B', category: 'Parts', roles: ['Manager'], price: '$300', avail: 'In Stock' },
  { sku: 'SKU-003', product: 'Component C', category: 'Electronics', roles: ['Admin'], price: '$750', avail: 'In Stock' },
];

const mockActivity = [
  { id: 1, title: 'Order Placed', desc: 'Order ORD-001 was placed', date: '2 hours ago' },
  { id: 2, title: 'User Added', desc: 'New user John Doe was added to the client', date: '1 day ago' },
  { id: 3, title: 'Contract Updated', desc: 'Contract for services was updated', date: '3 days ago' },
];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const clientData = mockClientData[id as keyof typeof mockClientData] || mockClientData['CLI-001'];

  const downloadPDF = async () => {
    if (!pdfRef.current) return;

    try {
      // Create canvas from the PDF content
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF with proper dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`${clientData.name}-profile.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm text-gray-600">
            <button onClick={() => navigate('/clients')} className="flex items-center gap-1 hover:text-blue-600">
              <ChevronLeft size={16} /> Clients
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{clientData.name}</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{clientData.name}</h1>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-4 mt-10 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Mail size={16} /> Email
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Phone size={16} /> Call
                </button>
                <button onClick={downloadPDF} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Download size={16} /> Download Profile
                </button>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{clientData.total_users}</p>
                  <p className="text-xs text-gray-500 mt-2">{clientData.active_users} Active</p>
                  <p className="text-xs text-gray-500">{clientData.pending_users} Pending Invites</p>
                </div>
                <Users size={24} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Spends</p>
                  <p className="text-2xl font-bold text-gray-900">${(clientData.total_spends / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-500 mt-2">Year to date</p>
                  <p className="text-xs text-gray-500">Last Payment: ${(clientData.last_payment / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-500">{clientData.last_payment_date}</p>
                </div>
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Open Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{clientData.open_orders}</p>
                  <p className="text-xs text-gray-500 mt-2">${(clientData.order_value / 1000).toFixed(1)}k value</p>
                  <p className="text-xs text-gray-500">{clientData.contract_status}</p>
                </div>
                <ShoppingCart size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 sticky top-24 space-y-4">
              {/* Client Card */}
              <div className="text-center pb-4 border-b">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">{clientData.logo}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{clientData.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{clientData.subtitle}</p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-start gap-2">
                  <Mail size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700 break-all">{clientData.email}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700">{clientData.phone}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700">{clientData.address}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Globe size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700">{clientData.website}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pb-4 border-b">
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Mail size={14} /> Email
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Phone size={14} /> Call
                </button>
              </div>

              {/* Contract Progress */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Contract Progress</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-gray-600">{clientData.contract_progress} days left</p>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-2 gap-2 text-center py-2 border-t pt-4">
                <div>
                  <p className="text-xs text-gray-600">Client Since</p>
                  <p className="text-sm font-semibold text-gray-900">{clientData.client_since}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Client ID</p>
                  <p className="text-sm font-semibold text-gray-900">{clientData.client_id}</p>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={downloadPDF}
                className="w-full px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download Profile
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white rounded-t-lg">
              <div className="flex gap-1 px-4 overflow-x-auto">
                {['Overview', 'Roles', 'Users', 'Orders', 'Services', 'Catalog', 'Activity', 'Configuration'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.toLowerCase()
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div ref={pdfRef} className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe size={20} /> Company Details
                      </h3>
                      <div className="space-y-3">
                        <div><p className="text-xs text-gray-600">Name</p><p className="text-sm font-medium text-gray-900">{clientData.company_name}</p></div>
                        <div><p className="text-xs text-gray-600">Category</p><p className="text-sm font-medium text-gray-900">{clientData.category}</p></div>
                        <div><p className="text-xs text-gray-600">Employees</p><p className="text-sm font-medium text-gray-900">{clientData.employees}</p></div>
                        <div><p className="text-xs text-gray-600">Website</p><p className="text-sm font-medium text-blue-600">{clientData.website}</p></div>
                        <div><p className="text-xs text-gray-600">Phone</p><p className="text-sm font-medium text-gray-900">{clientData.phone}</p></div>
                        <div><p className="text-xs text-gray-600">Billing Email</p><p className="text-sm font-medium text-gray-900">{clientData.billing_email}</p></div>
                      </div>
                    </div>

                    {/* Spending Overview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} /> Spending Overview
                      </h3>
                      <div className="mb-4">
                        <button className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700">This Year</button>
                      </div>
                      <div className="bg-white rounded p-4 h-40 flex items-center justify-center border border-gray-200">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">${(clientData.total_spends / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-gray-600 mt-1">Total Spend</p>
                          <p className="text-xs text-green-600 mt-2">+12.5% vs last year</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Spend Categories */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Spend Categories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="w-40 h-40 mx-auto flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">4</p>
                            <p className="text-xs text-gray-600">Categories</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          <span className="text-xs text-gray-700">Hardware 45%</span>
                          <span className="text-xs font-semibold text-gray-900">$200,250</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <span className="text-xs text-gray-700">Software 30%</span>
                          <span className="text-xs font-semibold text-gray-900">$30,300</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                          <span className="text-xs text-gray-700">Service 15%</span>
                          <span className="text-xs font-semibold text-gray-900">$15,300</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                          <span className="text-xs text-gray-700">Other 10%</span>
                          <span className="text-xs font-semibold text-gray-900">$10,500</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">User Summary</h4>
                        <Users size={18} className="text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-2xl font-bold text-gray-900">{clientData.total_users}</p>
                        <span className="text-xs text-gray-600">Total Users</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div><span className="text-green-600 font-semibold">{clientData.active_users}</span> <span className="text-gray-600">Active</span></div>
                        <div><span className="text-orange-600 font-semibold">{clientData.inactive_users}</span> <span className="text-gray-600">Inactive</span></div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">Recent Orders</h4>
                        <ShoppingCart size={18} className="text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-2xl font-bold text-gray-900">{clientData.open_orders}</p>
                        <span className="text-xs text-gray-600">Open Orders</span>
                      </div>
                      <div><span className="text-lg font-semibold text-gray-900">${(clientData.order_value / 1000).toFixed(1)}k</span> <span className="text-xs text-gray-600">Total Value</span></div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">Active Services</h4>
                        <Briefcase size={18} className="text-blue-600" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-2xl font-bold text-gray-900">{mockServices.length}</p>
                        <span className="text-xs text-gray-600">Active Contracts</span>
                      </div>
                      <div><span className="text-lg font-semibold text-blue-600">0 days</span> <span className="text-xs text-gray-600">Until Renewal</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="p-4 sm:p-6">
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                    <button className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg whitespace-nowrap">Total Users ({mockUsers.length})</button>
                    <button className="px-3 py-2 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 whitespace-nowrap hover:bg-gray-100">Pending (1)</button>
                    <button className="px-3 py-2 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 whitespace-nowrap hover:bg-gray-100">Inactive (0)</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Name / Role</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Email</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Phone</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Last Active</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">{user.id}</td>
                            <td className="px-4 py-3"><div className="font-medium text-gray-900">{user.name}</div><div className="text-xs text-gray-600">{user.role}</div></td>
                            <td className="px-4 py-3 text-gray-700">{user.email}</td>
                            <td className="px-4 py-3 text-gray-700">{user.phone}</td>
                            <td className="px-4 py-3 text-gray-700 text-xs">{user.lastActive}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{user.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Roles Tab */}
              {activeTab === 'roles' && (
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Roles Management</h3>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {mockRoles.map((role) => (
                      <div key={role.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                          <h4 className="font-semibold text-gray-900">{role.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{role.permissions}</p>
                          <p className="text-xs text-gray-500 mt-2">{role.users} user(s)</p>
                        </div>
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50">Edit</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">ORDER ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">DATE</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">ITEMS</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">AMOUNT</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">VENDOR</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-blue-600">{order.id}</td>
                            <td className="px-4 py-3 text-gray-700">{order.date}</td>
                            <td className="px-4 py-3 text-gray-700">{order.items}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{order.amount}</td>
                            <td className="px-4 py-3 text-gray-700">{order.vendor}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">SERVICE ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">SERVICE NAME</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">PROVIDER</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">START DATE</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">AMOUNT</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockServices.map((svc) => (
                          <tr key={svc.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-blue-600">{svc.id}</td>
                            <td className="px-4 py-3 text-gray-900">{svc.name}</td>
                            <td className="px-4 py-3 text-gray-700">{svc.provider}</td>
                            <td className="px-4 py-3 text-gray-700">{svc.date}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{svc.amount}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{svc.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Catalog Tab */}
              {activeTab === 'catalog' && (
                <div className="p-4 sm:p-6">
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">SKU</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">PRODUCT</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">CATEGORY</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">ROLES</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">PRICE</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">AVAILABILITY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockCatalog.map((item) => (
                          <tr key={item.sku} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">{item.sku}</td>
                            <td className="px-4 py-3 text-gray-900">{item.product}</td>
                            <td className="px-4 py-3 text-gray-700">{item.category}</td>
                            <td className="px-4 py-3 text-gray-700 text-xs">{item.roles.join(', ')}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.price}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{item.avail}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Recent Activity</h3>
                  <p className="text-sm text-gray-600 mb-6">Latest updates for this client</p>
                  <div className="space-y-6">
                    {mockActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-4 pb-6 border-b last:border-b-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Package size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.desc}</p>
                          <p className="text-xs text-gray-500 mt-2">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuration Tab */}
              {activeTab === 'configuration' && (
                <div className="p-4 sm:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">API Settings</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <div className="flex gap-2">
                        <input type="password" value="••••••••••••" readOnly className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Regenerate</button>
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
                    <button className="px-4 py-2 border border-red-300 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2">
                      <Archive size={16} /> Archive Client
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
