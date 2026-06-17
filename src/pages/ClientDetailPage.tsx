import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, MoreVertical, Mail, Phone } from 'lucide-react';
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
  logo?: string;
  employees: number;
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
}

const mockClients: Record<string, MockClient> = {
  'CLI-001': {
    id: 'CLI-001',
    name: 'veera industries',
    category: 'Technology',
    email: 'Veeru@indu.com',
    phone: '9784515647',
    address: 'No address',
    website: 'www.veeraindustries.com',
    employees: 51200,
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
    employees: 250,
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
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      const pageData = canvas.toDataURL('image/png');
      let heightLeft2 = imgHeight;

      pdf.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft2 -= pageHeight;

      while (heightLeft2 >= 0) {
        position = heightLeft2 - imgHeight;
        pdf.addPage();
        pdf.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft2 -= pageHeight;
      }

      pdf.save(`${client.name.replace(/\s+/g, '_')}-profile.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <ChevronLeft size={16} className="cursor-pointer" onClick={() => navigate('/clients')} />
            <span>Clients</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">{client.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
        </div>
      </div>

      <div className="max-w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-3 lg:col-span-3 md:col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              {/* Client Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200">
                  <span className="text-3xl font-bold text-blue-600">
                    {client.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
              </div>

              {/* Client Info */}
              <h2 className="text-center text-lg font-bold text-gray-900 mb-1">{client.name}</h2>
              <p className="text-center text-sm text-gray-600 mb-4">Premium Client • Since {client.joinedDate}</p>

              {/* Contact Info */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-700">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-700">{client.phone}</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Address:</span> {client.address}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">Website:</span> {client.website}
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
                  <span className="text-xs font-semibold text-blue-600">0 days left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b text-xs">
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
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download Profile
              </button>
            </div>
          </div>

          {/* Right Main Area */}
          <div className="col-span-9 lg:col-span-9 md:col-span-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Total Users */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Total Users</p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{client.totalUsers}</h3>
                    <p className="text-xs text-gray-600">{client.activeUsers} Active</p>
                    <p className="text-xs text-gray-600">{client.pendingUsers} Pending Invites</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">👥</span>
                  </div>
                </div>
              </div>

              {/* Total Spends */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Total Spends</p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">${(client.totalSpends / 1000).toFixed(0)}k</h3>
                    <p className="text-xs text-gray-600">Year to date</p>
                    <p className="text-xs text-gray-600">Last Payment: ${(client.lastPayment / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">💰</span>
                  </div>
                </div>
              </div>

              {/* Open Orders */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Open Orders</p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{client.openOrders}</h3>
                    <p className="text-xs text-gray-600">${(client.ordersValue / 1000).toFixed(1)}k value</p>
                    <p className="text-xs text-gray-600">Contracts</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-lg">📦</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                {['overview', 'roles', 'users', 'orders', 'services', 'catalog', 'activity', 'configuration'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                      activeTab === tab
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div ref={contentRef} className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Company Details */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Company Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xl">🏢</span>
                            <span className="text-gray-700">{client.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xl">📁</span>
                            <span className="text-gray-700">{client.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xl">👥</span>
                            <span className="text-gray-700">{client.employees.toLocaleString()} employees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xl">🌐</span>
                            <a href={`https://${client.website}`} className="text-blue-600 hover:underline">
                              {client.website}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xl">📞</span>
                            <span className="text-gray-700">{client.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xl">📧</span>
                            <span className="text-gray-700">{client.billingEmail}</span>
                          </div>
                        </div>
                      </div>

                      {/* Spending Overview */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Spending Overview</h3>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="text-sm text-gray-600 mb-1">This Year</div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">${(client.totalSpends / 1000).toFixed(0)}k</h2>
                          <p className="text-sm text-gray-600 mb-3">Total Spend</p>
                          <p className="text-sm text-green-600 mb-3">+12.5% vs last year</p>
                          <div className="bg-white rounded p-3 text-xs">
                            <div className="flex justify-between items-center h-12">
                              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                                <div key={month} className="flex-1 flex items-end justify-center gap-1 px-0.5">
                                  <div
                                    className="bg-blue-600 rounded-t w-2"
                                    style={{ height: `${Math.random() * 100}%`, minHeight: '4px' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Top Spend Categories */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-bold text-gray-900 mb-3">Top Spend Categories</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                <span>Hardware 45%</span>
                              </div>
                              <span className="font-semibold">$200,250</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                <span>Software 30%</span>
                              </div>
                              <span className="font-semibold">$30,300</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>Service 15%</span>
                              </div>
                              <span className="font-semibold">$15,300</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                <span>Other 10%</span>
                              </div>
                              <span className="font-semibold">$10,500</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-600 font-medium">User Summary</p>
                          </div>
                          <span className="text-lg">→</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-bold text-gray-900">{client.totalUsers}</span>
                          <span className="text-sm text-gray-600">Total Users</span>
                        </div>
                        <div className="flex gap-4 mt-3">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">{client.activeUsers}</div>
                            <div className="text-xs text-green-600">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-orange-600">{client.pendingUsers}</div>
                            <div className="text-xs text-orange-600">Pending</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Recent Orders</p>
                          </div>
                          <span className="text-lg">→</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-bold text-gray-900">${(client.ordersValue / 1000).toFixed(1)}k</span>
                          <span className="text-sm text-gray-600">Total Value</span>
                        </div>
                        <div className="text-center mt-3">
                          <div className="text-xl font-bold text-gray-900">{client.openOrders}</div>
                          <div className="text-xs text-gray-600">Open Orders</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Active Services</p>
                          </div>
                          <span className="text-lg">→</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-bold text-gray-900">{client.activeServices}</span>
                          <span className="text-sm text-gray-600">Active Contracts</span>
                        </div>
                        <div className="text-center mt-3">
                          <div className="text-xl font-bold text-gray-900">{client.daysUntilRenewal}</div>
                          <div className="text-xs text-gray-600">Until Renewal</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'roles' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Roles Management - Coming Soon</p>
                    <p className="text-sm mt-2">Manage client roles and permissions here</p>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Users Management - Coming Soon</p>
                    <p className="text-sm mt-2">Manage client users here</p>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Orders Management - Coming Soon</p>
                    <p className="text-sm mt-2">View and manage client orders here</p>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Services Management - Coming Soon</p>
                    <p className="text-sm mt-2">Manage client services here</p>
                  </div>
                )}

                {activeTab === 'catalog' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Catalog Management - Coming Soon</p>
                    <p className="text-sm mt-2">Manage client catalog here</p>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Activity Log - Coming Soon</p>
                    <p className="text-sm mt-2">View client activity log here</p>
                  </div>
                )}

                {activeTab === 'configuration' && (
                  <div className="py-8 text-center text-gray-600">
                    <p>Configuration - Coming Soon</p>
                    <p className="text-sm mt-2">Configure client settings here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
