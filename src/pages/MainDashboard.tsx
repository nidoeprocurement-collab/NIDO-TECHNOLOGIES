export default function MainDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Main Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of your procurement operations</p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Trends</h3>
          <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {['Total Orders', 'Pending', 'Completed'].map((metric) => (
            <div key={metric} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{metric}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">542</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
