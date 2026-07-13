import {
  Plus,
  Download,
  Printer,
  UploadCloud,
  MoreHorizontal,
} from "lucide-react";

export default function ExpensesInbox() {
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200">

          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-500">
              Receipt Inbox
            </button>

            <h1 className="text-2xl font-bold text-gray-900">
              All Expenses
            </h1>
          </div>

          <div className="flex gap-2">
            <button className="border rounded-lg px-2 py-2 text-sm flex items-center gap-2">
              <Download size={16} />
              Export
            </button>

            <button className="bg-blue-600 text-white rounded-lg px-2 py-2 text-sm flex items-center gap-2">
              <Plus size={16} />
              New
            </button>

            <button className="border rounded-lg p-2">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Expense List */}
        <div className="p-3 border-b">
          <div className="border border-gray-200 rounded-lg overflow-hidden">

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3"></th>
                  <th className="text-left">DATE</th>
                  <th className="text-left">EXPENSE ACCOUNT</th>
                  <th className="text-left">REFERENCE #</th>
                  <th className="text-left">VENDOR NAME</th>
                  <th className="text-left">PAID THROUGH</th>
                  <th className="text-left">CUSTOMER NAME</th>
                  <th className="text-left">STATUS</th>
                </tr>
              </thead>

              <tbody>
                {[
                  {
                    date: "2020-08-28",
                    account: "Automobile Expense",
                    ref: "S14682",
                    vendor: "WICKED RIDE ADVENTURE SERVICES",
                  },
                  {
                    date: "2020-06-26",
                    account: "Materials",
                    ref: "160",
                    vendor: "Monish Glass Plywood",
                  },
                  {
                    date: "2020-06-13",
                    account: "Materials",
                    ref: "132",
                    vendor: "Monish Glass Plywood",
                  },
                ].map((item, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <input type="checkbox" />
                    </td>

                    <td>{item.date}</td>

                    <td className="text-blue-600">
                      {item.account}
                    </td>

                    <td className="text-blue-600">
                      {item.ref}
                    </td>

                    <td>{item.vendor}</td>

                    <td>GST Payable</td>

                    <td>-</td>

                    <td>
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                        NON-BILLABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>

        {/* Expense Details */}
        <div className="p-4">

          <div className="flex items-center justify-between mb-4">

            <h2 className="font-semibold text-lg">
              Expense Details
            </h2>

            <div className="flex gap-2">
              <button className="border rounded px-2 py-1 text-sm">
                Edit
              </button>

              <button className="border rounded px-2 py-1 text-sm">
                Make Recurring
              </button>

              <button className="border rounded px-2 py-1 text-sm flex items-center gap-1">
                <Printer size={14} />
                Print
              </button>

              <button className="border rounded p-2">
                <MoreHorizontal size={14} />
              </button>
            </div>

          </div>

          <div className="grid grid-cols-12 gap-8">

            {/* Left Info */}
            <div className="col-span-5">

              <p className="text-xs text-gray-500">
                Expense Amount
              </p>

              <h2 className="text-4xl font-bold text-red-500">
                ₹44,835.00
              </h2>

              <p className="text-sm text-gray-500">
                2020-08-28
              </p>

              <div className="mt-2">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                  NON-BILLABLE
                </span>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <InfoRow
                  label="Paid Through"
                  value="GST Payable"
                />

                <InfoRow
                  label="Tax Amount"
                  value="₹6,839.24"
                />

                <InfoRow
                  label="Customer"
                  value="-"
                />

                <InfoRow
                  label="GST Treatment"
                  value="Registered Business"
                />

                <InfoRow
                  label="HSN Code"
                  value="3921"
                />
              </div>

            </div>

            {/* Center Details */}
            <div className="col-span-4">

              <div className="space-y-2 text-sm">
                <InfoRow
                  label="Tax"
                  value="GST18%"
                />

                <InfoRow
                  label="Ref No"
                  value="S14682"
                />

                <InfoRow
                  label="Vendor"
                  value="WICKED RIDE ADVENTURE SERVICES"
                />

                <InfoRow
                  label="Source"
                  value="Karnataka"
                />

                <InfoRow
                  label="Destination"
                  value="Karnataka"
                />
              </div>

            </div>

            {/* Receipt Upload */}
            <div className="col-span-3">

              <div className="border-2 border-dashed rounded-xl p-2 text-center">
                <UploadCloud
                  size={40}
                  className="mx-auto text-gray-400"
                />

                <h3 className="font-medium mt-3">
                  Drag or Drop your Receipts
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Maximum size 10 MB
                </p>

                <button className="mt-4 border rounded-lg px-2 py-2 text-sm">
                  Upload your File
                </button>
              </div>

            </div>

          </div>

          {/* Journal Table */}

          <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden">

            <div className="bg-gray-50 p-2 font-medium">
              Journal
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">
                    ACCOUNT
                  </th>

                  <th className="text-right">
                    DEBIT
                  </th>

                  <th className="text-right pr-4">
                    CREDIT
                  </th>
                </tr>
              </thead>

              <tbody>

                <JournalRow
                  account="Automobile Expense"
                  debit="₹37,995.76"
                  credit="₹0.00"
                />

                <JournalRow
                  account="GST Payable"
                  debit="₹0.00"
                  credit="₹44,835.00"
                />

                <JournalRow
                  account="Input CGST"
                  debit="₹3,419.62"
                  credit="₹0.00"
                />

                <JournalRow
                  account="Input SGST"
                  debit="₹3,419.62"
                  credit="₹0.00"
                />

                <JournalRow
                  account="Total"
                  debit="₹44,835.00"
                  credit="₹44,835.00"
                  bold
                />

              </tbody>
            </table>

          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}

function JournalRow({
  account,
  debit,
  credit,
  bold,
}: any) {
  return (
    <tr className="border-t">
      <td className={`p-3 ${bold ? "font-bold" : ""}`}>
        {account}
      </td>

      <td className={`text-right ${bold ? "font-bold" : ""}`}>
        {debit}
      </td>

      <td className={`text-right pr-4 ${bold ? "font-bold" : ""}`}>
        {credit}
      </td>
    </tr>
  );
}