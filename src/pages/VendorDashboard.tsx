export default function VendorDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Orders</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">23</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$45,231</p>
        </div>
      </div>
    </div>
  );
}
