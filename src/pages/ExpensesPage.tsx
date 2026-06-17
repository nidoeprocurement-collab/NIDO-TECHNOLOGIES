import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Calendar,
  Wallet,
  ShoppingBag,
  FileText,
  Receipt,
  Printer,
  MoreHorizontal,
} from "lucide-react";

export default function ExpensesDashboard() {
  const expenses = [
    {
      date: "28-Aug-2020",
      ref: "S14682",
      vendor: "WICKED RIDE ADVENTURE SERVICES PVT LTD",
      account: "Automobile Expense",
      status: "NON-BILLABLE",
      amount: "₹44,835.00",
    },
    {
      date: "26-Jun-2020",
      ref: "160",
      vendor: "Monish Glass Plywood & Hardware",
      account: "Materials",
      status: "NON-BILLABLE",
      amount: "₹44,835.00",
    },
    {
      date: "13-Jun-2020",
      ref: "132",
      vendor: "Monish Glass Plywood & Hardware",
      account: "Materials",
      status: "NON-BILLABLE",
      amount: "₹22,100.00",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-slate-900">
              Expenses
            </h1>
            <p className="text-slate-500 mt-2">
              Track and manage all your business expenses in one place.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="border bg-white px-4 py-3 rounded-xl flex items-center gap-2">
              <Upload size={18} />
              Import Expenses
            </button>

            <button className="border bg-white px-4 py-3 rounded-xl flex items-center gap-2">
              <Download size={18} />
              Export
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2">
              <Plus size={18} />
              New Expense
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Wallet className="text-blue-600" />}
            title="Total Expenses"
            value="₹1,11,770.00"
            subtitle="Total amount"
          />

          <StatCard
            icon={<ShoppingBag className="text-green-600" />}
            title="Total Transactions"
            value="3"
            subtitle="This Month"
          />

          <StatCard
            icon={<FileText className="text-orange-500" />}
            title="Billable"
            value="0"
            subtitle="Expenses"
          />

          <StatCard
            icon={<Receipt className="text-purple-600" />}
            title="Non-Billable"
            value="3"
            subtitle="Expenses"
          />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">

          {/* Left Section */}
          <div className="lg:col-span-7 bg-white rounded-2xl border overflow-hidden">

            {/* Filters */}
            <div className="p-4 border-b flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  placeholder="Search expenses..."
                  className="w-full border rounded-xl pl-10 py-3"
                />
              </div>

              <button className="border rounded-xl px-4 py-3 flex items-center gap-2">
                <Filter size={18} />
                Filter
              </button>

              <button className="border rounded-xl px-4 py-3 flex items-center gap-2">
                <Calendar size={18} />
                This Month
              </button>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-4"></th>
                  <th className="text-left">DATE</th>
                  <th className="text-left">REFERENCE #</th>
                  <th className="text-left">VENDOR NAME</th>
                  <th className="text-left">ACCOUNT</th>
                  <th className="text-left">STATUS</th>
                  <th className="text-left">AMOUNT</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <input type="checkbox" />
                    </td>

                    <td>{item.date}</td>

                    <td className="text-blue-600 font-medium">
                      {item.ref}
                    </td>

                    <td>{item.vendor}</td>

                    <td>{item.account}</td>

                    <td>
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                        {item.status}
                      </span>
                    </td>

                    <td className="font-medium">
                      {item.amount}
                    </td>

                    <td>
                      <MoreHorizontal size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 text-sm text-slate-500">
              Showing 1 to 3 of 3 entries
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl border p-5">

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-semibold">
                Expense Detail
              </h2>

              <div className="flex gap-2">
                <button className="border rounded-lg px-3 py-2">
                  <Printer size={18} />
                </button>

                <button className="border rounded-lg px-3 py-2">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-5">
              <p className="text-slate-500">
                Expense Amount
              </p>

              <h3 className="text-5xl font-bold text-red-500 mt-2">
                ₹44,835.00
              </h3>

              <p className="mt-2 text-slate-500">
                on 28-Aug-2020
              </p>

              <div className="flex gap-2 mt-4">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                  NON-BILLABLE
                </span>

                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
                  Automobile Expense
                </span>
              </div>
            </div>

            <div className="border rounded-xl p-5 text-sm space-y-4">
              <DetailRow
                label="Vendor Name"
                value="WICKED RIDE ADVENTURE SERVICES PVT LTD"
              />
              <DetailRow label="Reference Number" value="S14682" />
              <DetailRow label="Paid Through" value="GST Payable" />
              <DetailRow label="Expense Type" value="Services" />
              <DetailRow label="Tax" value="GST18%" />
              <DetailRow label="Tax Amount" value="₹6,839.24" />
              <DetailRow label="Source of Supply" value="Karnataka" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: any) {
  return (
    <div className="bg-white border rounded-2xl p-6">
      <div className="flex gap-4 items-center">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
          {icon}
        </div>

        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <h3 className="text-4xl font-bold mt-1">{value}</h3>
          <p className="text-slate-500 text-sm mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}