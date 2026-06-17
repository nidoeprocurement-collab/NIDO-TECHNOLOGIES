import { ArrowUp, ArrowDown, TrendingUp, Package, DollarSign, ShoppingCart, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const expensesData = [
  { date: 'May 20', value: 45000 },
  { date: 'May 21', value: 52000 },
  { date: 'May 22', value: 48000 },
  { date: 'May 23', value: 61000 },
  { date: 'May 24', value: 55000 },
  { date: 'May 26', value: 50000 },
];

const categoryData = [
  { name: 'Office Supplies', value: 35 },
  { name: 'IT & Electronics', value: 25 },
  { name: 'Industrial Supplies', value: 20 },
  { name: 'Services', value: 12 },
  { name: 'Others', value: 8 },
];

const orderStatusData = [
  { name: 'Completed', value: 61.8 },
  { name: 'Processing', value: 17.5 },
  { name: 'Pending Approval', value: 11.3 },
  { name: 'Cancelled', value: 9.4 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const CATEGORY_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280'];

const KPICard = ({ title, value, change, changeType, icon: Icon, bgColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow duration-200 h-full flex flex-col justify-between">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{value}</h3>
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
        <Icon size={20} className="sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
    <p className={`text-xs mt-2 sm:mt-3 flex items-center gap-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
      {changeType === 'positive' ? <ArrowUp size={12} className="sm:w-3.5 sm:h-3.5" /> : <ArrowDown size={12} className="sm:w-3.5 sm:h-3.5" />}
      <span className="truncate">{change} vs last month</span>
    </p>
  </div>
);

const MetricCard = ({ title, value, icon: Icon, bgColor, href }) => (
  <a href={href} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </a>
);

const RecentOrdersTable = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
      <a href="/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View all orders →</a>
    </div>
    <div className="overflow-x-auto min-w-0">
      <table className="w-full table-auto">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Order ID</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Client</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Vendor</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Amount</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3].map((i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-gray-900 dark:text-white">ORD-2024-{1340 + i}</td>
              <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm text-gray-600 dark:text-gray-400">Client {i}</td>
              <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm text-gray-600 dark:text-gray-400">Vendor {i}</td>
              <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-gray-900 dark:text-white">₹{(5000 * i).toLocaleString()}</td>
              <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Completed
                </span>
              </td>
              <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm text-gray-600 dark:text-gray-400">2024-05-{25 + i}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TopVendors = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Vendors by Spend</h3>
      <select className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-1 text-gray-700 dark:text-gray-300">
        <option>This Month</option>
      </select>
    </div>
    <div className="space-y-4">
      {[
        { rank: 1, name: 'Dell India Pvt. Ltd.', amount: '₹26.24L', percentage: 22.8 },
        { rank: 2, name: 'HP India Sales Pvt. Ltd.', amount: '₹22.10L', percentage: 19.1 },
        { rank: 3, name: 'Reliable Traders', amount: '₹15.79L', percentage: 13.7 },
        { rank: 4, name: 'Prime Distributors', amount: '₹12.42L', percentage: 10.8 },
        { rank: 5, name: 'TechMart Solutions', amount: '₹9.14L', percentage: 7.9 },
      ].map((vendor) => (
        <div key={vendor.rank} className="flex items-center gap-4">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
            {vendor.rank}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{vendor.name}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{vendor.amount}</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${vendor.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{vendor.percentage}%</p>
          </div>
        </div>
      ))}
    </div>
    <a href="/vendors" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-6 inline-block">View all vendors →</a>
  </div>
);

const RecentActivities = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
      <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View all activities →</a>
    </div>
    <div className="space-y-4">
      {[
        { icon: ShoppingCart, title: 'New order ORD-2024-1342 created', subtitle: 'Sam Technologies', time: '2 min ago' },
        { icon: Package, title: 'Vendor Dell India Pvt. Ltd. added', subtitle: 'System Owner', time: '15 min ago' },
        { icon: CheckCircle, title: 'Invoice INV-2024-5819 approved', subtitle: 'Finance Team', time: '1 hr ago' },
        { icon: Eye, title: 'New client TechWave Pvt. Ltd. added', subtitle: 'Admin', time: '2 hrs ago' },
        { icon: DollarSign, title: 'Payment of ₹98,230 completed', subtitle: 'ORD-2024-5341', time: '2 hrs ago' },
      ].map((activity, i) => (
        <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <activity.icon size={18} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{activity.subtitle}</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">{activity.time}</p>
        </div>
      ))}
    </div>
  </div>
);

export default function MainDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 lg:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, System Owner! 👋</h1>
            <p className="text-gray-600 dark:text-gray-400">Here&apos;s what&apos;s happening with your organization today.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-4 lg:gap-3 mb-6">
        <KPICard title="Total Clients" value="15" change="12.5%" changeType="positive" icon={Eye} bgColor="bg-blue-600" />
        <KPICard title="Total Vendors" value="2" change="8.3%" changeType="positive" icon={Package} bgColor="bg-green-600" />
        <KPICard title="Total Orders" value="0" change="16.7%" changeType="positive" icon={ShoppingCart} bgColor="bg-purple-600" />
        <KPICard title="Total Expenses" value="₹0" change="5.8%" changeType="negative" icon={DollarSign} bgColor="bg-red-600" />
        <KPICard title="Avg Order Value" value="₹0" change="19.4%" changeType="positive" icon={TrendingUp} bgColor="bg-indigo-600" />
        <KPICard title="Savings (This Month)" value="₹0" change="22.4%" changeType="positive" icon={CheckCircle} bgColor="bg-teal-600" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        {/* Expenses Overview */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses Overview</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-6">₹0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={expensesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Status</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This Month</p>
            </div>
            <select className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 text-gray-700 dark:text-gray-300">
              <option>This Month</option>
            </select>
          </div>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {orderStatusData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-4 mt-6 md:mt-8">
        <MetricCard title="Pending Approvals" value="156" icon={AlertCircle} bgColor="bg-yellow-500" href="/approvals" />
        <MetricCard title="Active Contracts" value="86" icon={CheckCircle} bgColor="bg-green-500" href="/contracts" />
        <MetricCard title="Open Invoices" value="231" icon={DollarSign} bgColor="bg-blue-500" href="/invoices" />
        <MetricCard title="Overdue Payments" value="18" icon={Clock} bgColor="bg-red-500" href="/payments" />
      </div>

      {/* Recent Orders */}
      <RecentOrdersTable />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        {/* Top Vendors */}
        <div className="lg:col-span-1">
          <TopVendors />
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
