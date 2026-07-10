import { Plus } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-white p-4">
      {/* Summary Card */}
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Capture payment receipts and maintain a stable customer payment trail.
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              Total Paid: Rs.0.00
            </h2>
          </div>

          <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition">
            <Plus size={18} />
            New
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Date
                </th>

                <th className="text-left px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Payment #
                </th>

                <th className="text-left px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Customer
                </th>

                <th className="text-left px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Invoice #
                </th>

                <th className="text-left px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Mode
                </th>

                <th className="text-left px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Status
                </th>

                <th className="text-right px-4 py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Empty State */}
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-16 text-slate-400"
                >
                  No payment records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}