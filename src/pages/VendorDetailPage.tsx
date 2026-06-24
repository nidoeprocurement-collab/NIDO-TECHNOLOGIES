'use client';

import React, { useState } from 'react';
import { Star, TrendingUp, ShoppingCart, CheckCircle, Award, FileText, CreditCard, MessageSquare, Phone, Mail, MapPin, Edit2, BarChart3, Eye } from 'lucide-react';

const VendorDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products (128)' },
    { id: 'orders', label: 'Orders (156)' },
    { id: 'performance', label: 'Performance' },
    { id: 'contracts', label: 'Contracts (3)' },
    { id: 'documents', label: 'Documents (24)' },
    { id: 'payments', label: 'Payments' },
    { id: 'notes', label: 'Notes & Activity' },
  ];

  const spendData = [
    { month: 'Jan', value: 180 },
    { month: 'Feb', value: 220 },
    { month: 'Mar', value: 190 },
    { month: 'Apr', value: 250 },
    { month: 'May', value: 150 },
    { month: 'Jun', value: 170 },
    { month: 'Jul', value: 240 },
    { month: 'Aug', value: 200 },
    { month: 'Sep', value: 210 },
    { month: 'Oct', value: 180 },
    { month: 'Nov', value: 190 },
    { month: 'Dec', value: 160 },
  ];

  const maxSpend = Math.max(...spendData.map(d => d.value));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Vendor Info Row */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                D
              </div>
              
              {/* Company Info */}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Dell India Pvt. Ltd.</h1>
                  <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Active</span>
                </div>
                
                {/* Metadata */}
                <div className="grid grid-cols-5 gap-8 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Vendor ID</p>
                    <p className="text-gray-900 font-semibold">VEN-1001</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Vendor Code</p>
                    <p className="text-gray-900 font-semibold">DELL-IND-001</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Category</p>
                    <p className="text-gray-900 font-semibold">IT Hardware</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Vendor Type</p>
                    <p className="text-gray-900 font-semibold">Supplier</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Onboarded On</p>
                    <p className="text-gray-900 font-semibold">Feb 10, 2024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Contact */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 w-72 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Primary Contact</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    R
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Rahul Sharma</p>
                    <p className="text-xs text-gray-600">Manager – Sales</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-blue-600">rahul.sharma@dell.com</p>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-900">+91 98765 43210</p>
                </div>

                <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message Vendor
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-6 gap-3 pt-3 border-t border-gray-200">
            {/* Rating */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600">Rating</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">4.8 / 5</p>
              <p className="text-xs text-green-600 font-medium">Top Performer</p>
            </div>

            {/* This Month Spend */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-gray-600">This Month Spend</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₹2,45,00,000</p>
              <p className="text-xs text-green-600 font-medium">↑ 12.6% vs last month</p>
            </div>

            {/* Total Orders */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-gray-600">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">156</p>
              <p className="text-xs text-gray-600">All Time</p>
            </div>

            {/* On-time Delivery */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs text-gray-600">On-time Delivery</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
              <p className="text-xs text-gray-600">SLA Adherence</p>
            </div>

            {/* Quality Score */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-gray-600">Quality Score</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">4.6 / 5</p>
              <p className="text-xs text-green-600 font-medium">Excellent</p>
            </div>

            {/* Contract Status */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-gray-600">Contract Status</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">Active</p>
              <p className="text-xs text-gray-600">Valid till Dec 31, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Left Column - Vendor Information */}
            <div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Vendor Information
                  <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Company Name</p>
                    <p className="text-sm text-gray-900 font-medium">Dell India Pvt. Ltd.</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Registered Name</p>
                    <p className="text-sm text-gray-900 font-medium">Dell India Private Limited</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">GSTIN</p>
                    <p className="text-sm text-gray-900 font-medium">29AABCD1234E1Z5</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">PAN</p>
                    <p className="text-sm text-gray-900 font-medium">AABCD1234E</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">CIN</p>
                    <p className="text-sm text-gray-900 font-medium">U7220DKA1PTC0545577</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Legal Entity Type</p>
                    <p className="text-sm text-gray-900 font-medium">Private Limited</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Year of Establishment</p>
                    <p className="text-sm text-gray-900 font-medium">2010</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Website</p>
                    <p className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">www.dell.com</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Vendor Status</p>
                    <p className="text-sm font-medium"><span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">Active</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Preferred Vendor</p>
                    <p className="text-sm text-gray-900 font-medium">Yes</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Vendor Tier</p>
                    <p className="text-sm text-gray-900 font-medium">Tier 1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Address & Categories */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  Address Information
                  <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Registered Address</h3>
                    <p className="text-sm text-gray-600">Divyasree Greens, #12/1, Challaghatta Village, Varthur Hobli, Bangalore – 560071, Karnataka, India</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Billing Address</h3>
                    <p className="text-sm text-gray-600">DLF Cyber City, Tower C, 8th Floor, Gurugram – 122002, Haryana, India</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-600">Same as Billing Address</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Categories & Products</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-3">Primary Categories</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">IT Hardware</span>
                      <span className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">Laptops</span>
                      <span className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">Desktops</span>
                      <span className="bg-pink-50 text-pink-700 text-xs px-3 py-1 rounded-full font-medium">Accessories</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Total Products</p>
                        <p className="text-lg font-bold text-gray-900">128</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Active Products</p>
                        <p className="text-lg font-bold text-green-600">120</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Out of Stock</p>
                        <p className="text-lg font-bold text-orange-600">5</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Inactive</p>
                        <p className="text-lg font-bold text-red-600">3</p>
                      </div>
                    </div>
                  </div>

                  <button className="text-blue-600 text-sm font-medium hover:underline mt-4">View All Products →</button>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Details & Performance */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  Business & Payment Details
                  <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Payment Terms</p>
                    <p className="text-sm text-gray-900 font-medium">Net 30</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Payment Method</p>
                    <p className="text-sm text-gray-900 font-medium">Bank Transfer</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Currency</p>
                    <p className="text-sm text-gray-900 font-medium">INR</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Credit Limit</p>
                    <p className="text-sm text-gray-900 font-medium">₹5,00,00,000</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Available Credit</p>
                    <p className="text-sm text-green-600 font-medium">₹2,75,00,000</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Bank Name</p>
                    <p className="text-sm text-gray-900 font-medium">HDFC Bank</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Bank Account No.</p>
                    <p className="text-sm text-gray-900 font-medium">50200012345678</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">IFSC Code</p>
                    <p className="text-sm text-gray-900 font-medium">HDFC0001234</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Vendor Performance (Last 6 Months)</h2>
                  <Eye className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Overall Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">4.8 / 5</p>
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-medium">Top Performer</span>
                    </div>
                  </div>

                  {[
                    { label: 'Quality', value: 4.6 },
                    { label: 'Delivery', value: 4.7 },
                    { label: 'Response Time', value: 4.8 },
                    { label: 'Pricing', value: 4.5 },
                    { label: 'Service', value: 4.6 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 font-medium">{item.label}</p>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="h-2 bg-blue-200 rounded-full flex-1 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.value / 5) * 100}%` }}></div>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 w-10 text-right">{item.value} / 5</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Active Contracts</h2>
                  <a href="#" className="text-blue-600 text-xs font-medium hover:underline">View All</a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Contracts</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Active Contracts</p>
                    <p className="text-2xl font-bold text-green-600">2</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Expiring in 30 Days</p>
                    <p className="text-2xl font-bold text-orange-600">0</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Expiring in 60 Days</p>
                    <p className="text-2xl font-bold text-red-600">1</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
                  <a href="#" className="text-blue-600 text-xs font-medium hover:underline">View All</a>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Purchase Order PO-10034 created</p>
                      <p className="text-xs text-gray-500">Apr 16, 2026 01:20 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Price updated for 5 products</p>
                      <p className="text-xs text-gray-500">Apr 15, 2026 11:10 AM</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Contract renewed (CT-2025-001)</p>
                      <p className="text-xs text-gray-500">Mar 28, 2026 04:30 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spend Summary Section */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Spend Summary</h2>
                <div className="flex items-center gap-2">
                  <select className="text-xs text-gray-600 bg-transparent border border-gray-200 rounded px-2 py-1">
                    <option>This Year</option>
                  </select>
                  <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </div>

              <div className="flex items-end gap-2 h-64 justify-center">
                {spendData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-blue-100 rounded-t hover:bg-blue-200 transition" style={{ height: `${(item.value / maxSpend) * 200}px` }}></div>
                    <p className="text-xs text-gray-600 font-medium">{item.month}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Spend Metrics</h2>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Total Spend</p>
                  <p className="text-3xl font-bold text-gray-900">₹12,45,00,000</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Orders</p>
                  <p className="text-3xl font-bold text-gray-900">156</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Avg. Order Value</p>
                  <p className="text-3xl font-bold text-gray-900">₹7,98,717</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Content */}
      {activeTab !== 'overview' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium">Content for {tabs.find(t => t.id === activeTab)?.label} tab</p>
            <p className="text-gray-500 text-sm mt-2">This tab is active and ready for content</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetailPage;
