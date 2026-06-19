import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Mail, Phone, MapPin, Globe, FileText,
  Users, ShoppingCart, Zap, Download, TrendingUp
} from 'lucide-react';
/*import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ClientUsers } from './ClientUsers';*/
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Client {
  id: string;
  name: string;
  representative: string;
  email: string;
  totalSpend: number;
  status: 'active' | 'pending' | 'inactive';
}

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

const spendingData = [
  { month: 'Feb', amount: 6000 },
  { month: 'Mar', amount: 9000 },
  { month: 'Apr', amount: 7500 },
  { month: 'May', amount: 11000 },
  { month: 'Jun', amount: 8500 },
  { month: 'Jul', amount: 13000 },
  { month: 'Aug', amount: 10000 },
  { month: 'Sep', amount: 14500 },
  { month: 'Oct', amount: 12000 },
];

const spendCategories = [
  { name: 'Hardware', value: 45, amount: '$200,250', color: '#2563EB' },
  { name: 'Software', value: 30, amount: '$30,300', color: '#7C3AED' },
  { name: 'Service', value: 15, amount: '$15,300', color: '#059669' },
  { name: 'Other', value: 10, amount: '$10,500', color: '#D97706' },
];

function ClientOverview({ client }: { client: Client }) {
  const initials = client.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-6">
      {/* Left profile card */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
            <p className="text-xs text-blue-600 mt-0.5">Premium Client • Since 2026</p>
          </div>
          <div className="w-full text-left space-y-2 mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">nitinahetty@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>080-4000057</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>No address</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>N/A</span>
            </div>
          </div>
          <div className="flex gap-2 w-full mt-2">
            <Button size="sm" className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
              <Mail className="h-3 w-3 mr-1" /> Email
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
              <Phone className="h-3 w-3 mr-1" /> Call
            </Button>
          </div>
        </div>

        {/* Contract Progress */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Contract Progress</span>
            <span className="text-xs text-orange-500 font-medium">0 days left</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '98%' }} />
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            <div>
              <p className="text-gray-400">Client Since</p>
              <p className="font-medium text-gray-700">Jun 2026</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Client ID</p>
              <p className="font-medium text-gray-700">Cl-00020</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="w-full mt-3 h-7 text-xs">
            <Download className="h-3 w-3 mr-1" /> Download Profile
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Users */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-gray-500">32 Active</span>
                  <span className="text-xs text-orange-500">3 Pending Invites</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Invoice */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Invoice</p>
                <p className="text-2xl font-bold text-gray-900">$101,000</p>
                <p className="text-xs text-gray-500 mt-1">Year to date</p>
                <p className="text-xs text-gray-400">Last Payment: $20,000 Jan 11, 2026</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          {/* Open Orders */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Open Orders</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-gray-500 mt-1">$32,500 value</p>
                <p className="text-xs text-gray-400">3 contracts</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Three-column detail row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Company Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Company Details</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-xs text-gray-700">Nitin Supplies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-3 w-3 text-purple-600" />
                </div>
                <span className="text-xs text-gray-700">Technology</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-3 w-3 text-gray-500" />
                </div>
                <span className="text-xs text-gray-700">51-200 employees</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-3 w-3 text-blue-600" />
                </div>
                <a href="#" className="text-xs text-blue-600 hover:underline">www.nitinsupplies.com</a>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-3 w-3 text-gray-500" />
                </div>
                <span className="text-xs text-gray-700">080-4000017</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3 w-3 text-gray-500" />
                </div>
                <span className="text-xs text-gray-600 truncate">nitinahetty@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Spending Overview */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">Spending Overview</p>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">This Year</span>
            </div>
            <p className="text-lg font-bold text-gray-900">$101,000</p>
            <p className="text-xs text-gray-500 mb-1">Total Spend</p>
            <div className="flex items-center gap-1 mb-3">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+12.5% vs last year</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={spendingData} barSize={8}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number) => [`$${(v / 1000).toFixed(0)}k`, 'Spend']}
                  contentStyle={{ fontSize: 10, padding: '4px 8px' }}
                />
                <Bar dataKey="amount" fill="#2563EB" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Spend Categories */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Top Spend Categories</p>
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie
                    data={spendCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={42}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {spendCategories.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {spendCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-600">{cat.name} {cat.value}%</span>
                    </div>
                    <span className="font-medium text-gray-800">{cat.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* User Summary */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">User Summary</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-4 flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 mx-auto mb-1">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">24</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mx-auto mb-1">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 mx-auto mb-1">
                  <Users className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">4</p>
                <p className="text-xs text-gray-500">Inactive</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Recent Orders</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-4 flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 mx-auto mb-1">
                  <ShoppingCart className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">3</p>
                <p className="text-xs text-gray-500">Open Orders</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mx-auto mb-1">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">$32,500</p>
                <p className="text-xs text-gray-500">Total Value</p>
              </div>
            </div>
          </div>

          {/* Active Services */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Active Services</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-4 flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 mx-auto mb-1">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-500">Active Contracts</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 mx-auto mb-1">
                  <FileText className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">0 days</p>
                <p className="text-xs text-gray-500">Until Renewal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientDetail({ client, onBack }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6">
      {/* Breadcrumb + title */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-1"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          Clients
        </button>
        <div className="text-xs text-gray-400 mb-1">Clients / {client.name}</div>
        <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0 w-full justify-start mb-4">
          {['overview', 'roles', 'users', 'orders', 'services', 'catalog', 'activity', 'configuration'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-4 py-2.5 text-sm capitalize"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <ClientOverview client={client} />
        </TabsContent>

        <TabsContent value="roles" className="mt-0">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-2">Roles Management</h3>
            <p className="text-sm text-gray-500">Client roles will be displayed here.</p>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <ClientUsers clientId={client.id} clientName={client.name} />
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-2">Order History</h3>
            <p className="text-sm text-gray-500">Client orders will be displayed here.</p>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-2">Service History</h3>
            <p className="text-sm text-gray-500">Client services will be displayed here.</p>
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="mt-0">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-2">Client Catalog</h3>
            <p className="text-sm text-gray-500">Client catalog will be displayed here.</p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-2">Activity Log</h3>
            <p className="text-sm text-gray-500">Client activity will be displayed here.</p>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="mt-0">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-semibold mb-2">Configuration Settings</h3>
            <p className="text-sm text-gray-500">Client configuration will be displayed here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
