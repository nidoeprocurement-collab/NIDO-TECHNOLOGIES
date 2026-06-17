import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Mail, Phone, MapPin, Globe, Users, ShoppingCart, Calendar, BarChart3, Edit } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MockClient {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  employees: string;
  joinedDate: string;
  billingEmail: string;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalSpends: number;
  lastPayment: number;
  lastPaymentDate: string;
  openOrders: number;
  ordersValue: number;
  activeServices: number;
  daysUntilRenewal: number;
  inactiveUsers: number;
}

const mockClients: Record<string, MockClient> = {
  'CLI-001': {
    id: 'CI-00023',
    name: 'veera industries',
    category: 'Technology',
    email: 'Veeru@indu.com',
    phone: '9784515647',
    address: 'No address',
    website: 'www.veeraindustries.com',
    employees: '51-200 employees',
    joinedDate: 'Jun 2026',
    billingEmail: 'Veeru@indu.com',
    totalUsers: 24,
    activeUsers: 12,
    pendingUsers: 3,
    inactiveUsers: 9,
    totalSpends: 101000,
    lastPayment: 25000,
    lastPaymentDate: 'Jan 11, 2026',
    openOrders: 3,
    ordersValue: 32500,
    activeServices: 2,
    daysUntilRenewal: 0,
  },
  'CLI-00023': {
    id: 'CLI-00023',
    name: 'TechVision Solutions',
    category: 'Technology',
    email: 'contact@techvision.com',
    phone: '9876543210',
    address: 'Tech Park, Bangalore',
    website: 'www.techvision.com',
    employees: '200-500 employees',
    joinedDate: 'Mar 2025',
    billingEmail: 'billing@techvision.com',
    totalUsers: 35,
    activeUsers: 28,
    pendingUsers: 5,
    inactiveUsers: 2,
    totalSpends: 150000,
    lastPayment: 40000,
    lastPaymentDate: 'Dec 15, 2025',
    openOrders: 5,
    ordersValue: 75000,
    activeServices: 3,
    daysUntilRenewal: 45,
  },
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  const client = mockClients[id || 'CLI-001'];

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Client Not Found</h2>
          <button
            onClick={() => navigate('/clients')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  const downloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageData = canvas.toDataURL('image/png');
      let heightLeft = imgHeight;

      pdf.addImage(pageData, 'PNG', 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        const position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${client.name.replace(/\s+/g, '_')}-profile.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white" ref={contentRef}>
      {/* Page Title */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
      </div>

      {/* Main Container */}
      <div className="px-6 pb-8">
        <div className="flex gap-8">
          {/* Left Sidebar - 25% width */}
          <div className="w-1/4 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-400 shadow-sm">
                  <span className="text-4xl font-bold text-blue-600">{initials}</span>
                </div>
              </div>

              {/* Client Name */}
              <h2 className="text-center text-base font-bold text-gray-900 mb-1">{client.name}</h2>
              <p className="text-center text-sm text-gray-600 mb-4">Premium Client • Since {client.joinedDate}</p>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 break-all">{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{client.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{client.website}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Mail size={16} />
                  Email
                </button>
                <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Phone size={16} />
                  Call
                </button>
              </div>

              {/* Contract Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">Contract Progress</span>
                  <span className="text-xs font-semibold text-blue-600">{client.daysUntilRenewal} days left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200 text-xs">
                <div>
                  <p className="text-gray-500">Client Since</p>
                  <p className="font-semibold text-gray-900">{client.joinedDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Client ID</p>
                  <p className="font-semibold text-gray-900">{client.id}</p>
                </div>
              </div>

              {/* Download Profile Button */}
              <button
                onClick={downloadPDF}
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2 border border-blue-200"
              >
                <Download size={16} />
                Download Profile
              </button>
            </div>
          </div>

          {/* Right Main Area - 75% width */}
          <div className="flex-1">
            {/* Top 3 Stat Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Total Users */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <Users size={14} className="text-blue-600" /> Total Users
                    </p>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{client.totalUsers}</h3>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-600">{client.activeUsers} Active</p>
                  <p className="text-xs text-gray-600">{client.pendingUsers} Pending Invites</p>
                </div>
              </div>

              {/* Total Spends */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <BarChart3 size={14} className="text-green-600" /> Total Spends
                    </p>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">${(client.totalSpends / 1000).toFixed(0)}k</h3>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-600">Year to date</p>
                  <p className="text-xs text-gray-600">Last Payment: ${(client.lastPayment / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-600">{client.lastPaymentDate}</p>
                </div>
              </div>

              {/* Open Orders */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                      <ShoppingCart size={14} className="text-orange-600" /> Open Orders
                    </p>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{client.openOrders}</h3>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-600">${(client.ordersValue / 1000).toFixed(1)}k value</p>
                  <p className="text-xs text-gray-600">Contracts</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-6">
              {['overview', 'roles', 'users', 'orders', 'services', 'catalog', 'activity', 'configuration'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content Area */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Company Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" /> Company Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-sm font-medium text-gray-900">{client.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Employees</p>
                      <p className="text-sm font-medium text-gray-900">{client.employees}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Website</p>
                      <p className="text-sm font-medium text-blue-600">{client.website}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Billing Email</p>
                      <p className="text-sm font-medium text-gray-900">{client.billingEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Spending Overview */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Spending Overview</h3>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">${(client.totalSpends / 1000).toFixed(0)}k</div>
                    <button className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">This Year</button>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Total Spend</p>
                  <p className="text-xs text-green-600 font-medium mb-4">+12.5% vs last year</p>
                  {/* Simplified Bar Chart */}
                  <div className="flex items-end justify-between gap-1 h-20">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-t"
                        style={{ height: `${Math.random() * 100}%`, minHeight: '4px' }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-2">Jan - Dec</div>
                </div>

                {/* Right Column - Top Spend Categories */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Top Spend Categories</h3>
                  <div className="flex items-center justify-between">
                    {/* Pie Chart Placeholder */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-green-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                      Chart
                    </div>
                    <div className="space-y-2 flex-1 ml-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span>Hardware</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">45%</span>
                          <span className="text-gray-500">$200,250</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Software</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">30%</span>
                          <span className="text-gray-500">$30,300</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span>Service</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">15%</span>
                          <span className="text-gray-500">$15,300</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span>Other</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">10%</span>
                          <span className="text-gray-500">$10,500</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                {/* Roles Management Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Roles Management</h3>
                  <p className="text-sm text-gray-600 mb-6">Roles determine what users in the client can access and do for the system. Each role comes with a set of permissions across modules. Users can only perform actions that their assigned roles allow.</p>
                  
                  {/* Roles Grid */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {/* System Owner */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-2">ALLOWED</span>
                          <h4 className="text-sm font-bold text-gray-900">System Owner</h4>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Unrestricted access with all permissions</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Data Visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Can Approver</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Approval Limit</span>
                        </div>
                      </div>
                    </div>

                    {/* Administrator */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-2">ALLOWED</span>
                          <h4 className="text-sm font-bold text-gray-900">Administrator</h4>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Full access to internal organizations</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Data Visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Can Approver</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Approval Limit</span>
                        </div>
                      </div>
                    </div>

                    {/* Procurement Specialist */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-2">ALLOWED</span>
                          <h4 className="text-sm font-bold text-gray-900">Procurement Specialist</h4>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Manage purchase orders and create purchase orders</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Data Visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Can Approver</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Approval Limit</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">PKG 100</p>
                    </div>

                    {/* Employee */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-2">ALLOWED</span>
                          <h4 className="text-sm font-bold text-gray-900">Employee</h4>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Basic access to dashboard and shop</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Data Visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Can Approver</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Approval Limit</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">Department Only</p>
                    </div>

                    {/* Vendor Administrator */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-2">ALLOWED</span>
                          <h4 className="text-sm font-bold text-gray-900">Vendor Administrator</h4>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Vendor account setup with full access</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Data Visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Can Approver</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Approval Limit</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">You Only</p>
                    </div>

                    {/* Accounts Payable Officer */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-2">ALLOWED</span>
                          <h4 className="text-sm font-bold text-gray-900">Accounts Payable Officer</h4>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Manage bills, invoices, and vendor credits</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Data Visibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Can Approver</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <span className="text-xs text-gray-700">Approval Limit</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">PKG 100000</p>
                    </div>
                  </div>

                  {/* Permission Matrix Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Permission Matrix</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Module</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">View</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Create</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Edit</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Delete</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Report</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Approve</th>
                            <th className="px-4 py-2 text-center font-semibold text-gray-700">Export</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['INVOICE', 'Purchase Orders', 'Shop', 'VENDORS', 'CLIENTS', 'Inventory', 'Transaction', 'Approvals', 'Reports & Analytics', 'Configuration', 'Audit Trail', 'Notifications', 'User Management'].map((module, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{module}</td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Permission Summary Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Permission Summary</h4>
                    <div className="grid grid-cols-3 gap-6">
                      {/* Dashboard */}
                      <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs font-semibold text-gray-900 mb-3">Dashboard</p>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Create</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">View</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Delete</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Print</button>
                        </div>
                      </div>

                      {/* Purchase Orders */}
                      <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs font-semibold text-gray-900 mb-3">Purchase Orders</p>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Approve</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Create</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Delete</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">View</button>
                        </div>
                      </div>

                      {/* Shop */}
                      <div className="border border-gray-200 rounded p-4">
                        <p className="text-xs font-semibold text-gray-900 mb-3">Shop</p>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Configurable</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Create</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Delete</button>
                          <button className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">View</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Tabs - Placeholder */}
            {activeTab !== 'overview' && activeTab !== 'roles' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management - Coming Soon
                </p>
              </div>
            )}

            {/* Bottom Summary Cards */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-3 gap-6 mt-6">
                {/* User Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users size={16} className="text-blue-600" /> User Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-end gap-4">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{client.totalUsers}</p>
                            <p className="text-xs text-gray-600">Total Users</p>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{client.activeUsers}</p>
                              <p className="text-gray-600">Active</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-orange-600">{client.inactiveUsers}</p>
                              <p className="text-gray-600">Inactive</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronLeft size={20} className="rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <ShoppingCart size={16} className="text-orange-600" /> Recent Orders
                      </h3>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">${(client.ordersValue / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-gray-600">Total Value</p>
                        <p className="text-xs text-gray-600 mt-2">{client.openOrders}</p>
                        <p className="text-xs text-gray-600">Open Orders</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronLeft size={20} className="rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Active Services */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-600" /> Active Services
                      </h3>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-blue-600">{client.daysUntilRenewal}</p>
                        <p className="text-xs text-gray-600">days</p>
                        <p className="text-xs text-gray-600">Until Renewal</p>
                        <p className="text-xs text-gray-600 mt-2">{client.activeServices}</p>
                        <p className="text-xs text-gray-600">Active Contracts</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronLeft size={20} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
