import { useMemo } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, Package, DollarSign, ShoppingCart, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { useMyOrders, type MyOrder } from '@/contexts/MyOrdersContext';
import { getVendors } from '@/lib/vendorDataStore';
import { getClients } from '@/lib/clientStore';
import { getAllPOs, type StoredPO } from '@/lib/purchaseOrderStore';
import { useI18n } from '@/i18n/I18nProvider';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
const CATEGORY_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280', '#ec4899'];

const KPICard = ({ title, value, icon: Icon, bgColor }: { title: string; value: string; icon: any; bgColor: string }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-5 md:p-6 hover:shadow-md transition-shadow duration-200 h-full flex flex-col justify-between">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{value}</h3>
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
        <Icon size={20} className="sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </div>
);

const MetricCard = ({ title, value, icon: Icon, bgColor, href }: { title: string; value: string | number; icon: any; bgColor: string; href: string }) => (
  <Link to={href} className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-lg transition-shadow cursor-pointer block">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </Link>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="h-full flex items-center justify-center text-sm text-gray-400 py-8">{label}</div>
);

function RecentOrdersTable({ orders, poByOrderId }: { orders: MyOrder[]; poByOrderId: Map<string, StoredPO> }) {
  const recent = orders.slice(0, 5);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <Link to="/my-orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View all orders →</Link>
      </div>
      {recent.length === 0 ? (
        <EmptyState label="No orders yet — orders you create will show up here." />
      ) : (
        <div className="overflow-x-auto min-w-0">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Order ID</th>
                <th className="px-4 md:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                <th className="px-4 md:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Vendor</th>
                <th className="px-4 md:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                <th className="px-4 md:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 md:px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recent.map((order) => {
                const po = poByOrderId.get(order.id);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-2 md:py-4 text-sm font-medium">
                      <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline cursor-pointer">{order.id}</Link>
                    </td>
                    <td className="px-4 md:px-6 py-2 md:py-4 text-sm text-gray-600">{order.client}</td>
                    <td className="px-4 md:px-6 py-2 md:py-4 text-sm text-gray-600">{po ? po.vendorName : '—'}</td>
                    <td className="px-4 md:px-6 py-2 md:py-4 text-sm font-medium text-gray-900">{order.totalAmount}</td>
                    <td className="px-4 md:px-6 py-2 md:py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-2 md:py-4 text-sm text-gray-600">{order.orderDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TopVendors({ vendorSpend }: { vendorSpend: { name: string; amount: number; percentage: number }[] }) {
  const { fmt } = useI18n();
  const formatRupees = (v: number) => fmt(v, true);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Vendors by Spend</h3>
      </div>
      {vendorSpend.length === 0 ? (
        <EmptyState label="No purchase orders placed with vendors yet." />
      ) : (
        <div className="space-y-4">
          {vendorSpend.map((vendor, i) => (
            <div key={vendor.name} className="flex items-center gap-4">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-bold text-blue-600">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatRupees(vendor.amount)}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${vendor.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{vendor.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/vendors" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-6 inline-block">View all vendors →</Link>
    </div>
  );
}

interface Activity {
  icon: any;
  title: string;
  subtitle: string;
  time: string;
  timestamp: number;
}

function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
      </div>
      {activities.length === 0 ? (
        <EmptyState label="Activity from new orders, vendors and clients will appear here." />
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity, i) => (
            <div key={i} className="flex items-start gap-2 pb-4 border-b border-gray-200 last:border-0">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <activity.icon size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-600">{activity.subtitle}</p>
              </div>
              <p className="text-xs text-gray-500 flex-shrink-0">{activity.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function MainDashboard() {
  const { fmt } = useI18n();
  const formatRupees = (v: number) => fmt(v, true);
  const { orders } = useMyOrders();
  const vendors = useMemo(() => getVendors().filter(v => !v.archived), []);
  const clients = useMemo(() => getClients(), []);
  const pos = useMemo(() => getAllPOs(), []);

  const poByOrderId = useMemo(() => {
    const map = new Map<string, StoredPO>();
    pos.forEach((po) => {
      if (!map.has(po.orderId)) map.set(po.orderId, po);
    });
    return map;
  }, [pos]);

  const totalExpenses = useMemo(() => pos.reduce((sum, po) => sum + (po.grandTotal || 0), 0), [pos]);
  const avgOrderValue = useMemo(() => {
    const withAmount = orders.filter(o => typeof o.totalAmountNum === 'number');
    if (withAmount.length === 0) return 0;
    return withAmount.reduce((sum, o) => sum + (o.totalAmountNum || 0), 0) / withAmount.length;
  }, [orders]);

  const orderStatusData = useMemo(() => {
    if (orders.length === 0) return [];
    const counts = new Map<string, number>();
    orders.forEach((o) => counts.set(o.status, (counts.get(o.status) || 0) + 1));
    return Array.from(counts.entries()).map(([name, count]) => ({
      name,
      value: (count / orders.length) * 100,
    }));
  }, [orders]);

  const categoryData = useMemo(() => {
    if (pos.length === 0) return [];
    const totals = new Map<string, number>();
    pos.forEach((po) => {
      po.items.forEach((item) => {
        totals.set(item.category || 'Other', (totals.get(item.category || 'Other') || 0) + (item.lineSubtotal || 0));
      });
    });
    const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    if (grandTotal === 0) return [];
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, value: Math.round((amount / grandTotal) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [pos]);

  const expensesTrend = useMemo(() => {
    if (pos.length === 0) return [];
    const byDate = new Map<string, number>();
    pos.forEach((po) => {
      const date = po.createdOnDisplay || po.createdOn;
      byDate.set(date, (byDate.get(date) || 0) + (po.grandTotal || 0));
    });
    return Array.from(byDate.entries())
      .map(([date, value]) => ({ date, value }))
      .slice(-8);
  }, [pos]);

  const vendorSpend = useMemo(() => {
    if (pos.length === 0) return [];
    const totals = new Map<string, number>();
    pos.forEach((po) => {
      totals.set(po.vendorName, (totals.get(po.vendorName) || 0) + (po.grandTotal || 0));
    });
    const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    if (grandTotal === 0) return [];
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount, percentage: (amount / grandTotal) * 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [pos]);

  const activities = useMemo(() => {
    const items: Activity[] = [];
    orders.slice(0, 3).forEach((o) => {
      items.push({
        icon: ShoppingCart,
        title: `Order ${o.id} created`,
        subtitle: o.client,
        time: '',
        timestamp: new Date(`${o.orderDate} ${o.orderTime}`).getTime() || 0,
      });
    });
    pos.slice(0, 3).forEach((po) => {
      items.push({
        icon: Package,
        title: `Purchase order ${po.poNumber} raised`,
        subtitle: po.vendorName,
        time: '',
        timestamp: new Date(po.createdOn).getTime() || 0,
      });
    });
    return items
      .filter((a) => a.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((a) => ({ ...a, time: timeAgo(a.timestamp) }));
  }, [orders, pos]);

  const pendingApprovals = orders.filter(o => o.status === 'Draft' || o.status === 'Processing').length;
  const activeContracts = vendors.filter(v => v.status === 'Active').length;
  const openPOs = pos.filter(po => po.status !== 'Closed' && po.status !== 'Cancelled').length;
  const cancelledPOs = pos.filter(po => po.status === 'Cancelled').length;

  return (
    <div className="space-y-2">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Welcome back, System Owner! 👋</h1>
            <p className="text-gray-600">Here&apos;s what&apos;s happening with your organization today.</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mb-2">
        <KPICard title="Total Clients" value={String(clients.length)} icon={Eye} bgColor="bg-blue-600" />
        <KPICard title="Total Vendors" value={String(vendors.length)} icon={Package} bgColor="bg-green-600" />
        <KPICard title="Total Orders" value={String(orders.length)} icon={ShoppingCart} bgColor="bg-purple-600" />
        <KPICard title="Total Expenses" value={formatRupees(totalExpenses)} icon={DollarSign} bgColor="bg-red-600" />
        <KPICard title="Avg Order Value" value={formatRupees(avgOrderValue)} icon={TrendingUp} bgColor="bg-indigo-600" />
        <KPICard title="Purchase Orders" value={String(pos.length)} icon={CheckCircle} bgColor="bg-teal-600" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 mt-6 md:mt-8">
        {/* Expenses Overview */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses Overview</h3>
          <p className="text-3xl font-bold text-gray-900 mb-6">{formatRupees(totalExpenses)}</p>
          <p className="text-sm text-gray-600">Total Expenses</p>
          <div className="mt-4 h-40">
            {expensesTrend.length === 0 ? (
              <EmptyState label="No purchase order spend recorded yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expensesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatRupees(value)} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {categoryData.length === 0 ? (
            <EmptyState label="No purchase order line items yet." />
          ) : (
            <>
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
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Order Status */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </div>
          </div>
          {orderStatusData.length === 0 ? (
            <EmptyState label="No orders placed yet." />
          ) : (
            <>
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
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
        <MetricCard title="Pending Approvals" value={pendingApprovals} icon={AlertCircle} bgColor="bg-yellow-500" href="/my-orders" />
        <MetricCard title="Active Vendors" value={activeContracts} icon={CheckCircle} bgColor="bg-green-500" href="/vendors" />
        <MetricCard title="Open Purchase Orders" value={openPOs} icon={DollarSign} bgColor="bg-blue-500" href="/vendors/orders" />
        <MetricCard title="Cancelled Purchase Orders" value={cancelledPOs} icon={Clock} bgColor="bg-red-500" href="/vendors/orders" />
      </div>

      {/* Recent Orders */}
      <RecentOrdersTable orders={orders} poByOrderId={poByOrderId} />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
        {/* Top Vendors */}
        <div className="lg:col-span-1">
          <TopVendors vendorSpend={vendorSpend} />
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <RecentActivities activities={activities} />
        </div>
      </div>
    </div>
  );
}
