import {
  Download,
  Plus,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";

export default function CreditNotesDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Sales &gt; Credit Notes
            </p>
            <h1 className="text-4xl font-bold">Credit Notes</h1>
            <p className="text-slate-500 mt-2">
              Create, manage and track customer credit notes.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="border rounded-lg px-4 py-2 flex items-center gap-2">
              <Download size={16} />
              Export
            </button>

            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2">
              <Plus size={16} />
              New Credit Note
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <SummaryCard
            title="Total Credits"
            value="₹45,000.00"
          />

          <SummaryCard
            title="Total Credit Notes"
            value="12"
          />

          <SummaryCard
            title="Draft"
            value="6"
          />

          <SummaryCard
            title="Open"
            value="6"
          />

          <SummaryCard
            title="Credit Value"
            value="₹45,000.00"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">

          {/* Table */}
          <div className="col-span-7 bg-white rounded-xl border">

            {/* Filters */}
            <div className="p-4 border-b flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  placeholder="Search credit notes..."
                  className="w-full border rounded-lg pl-10 pr-3 py-2"
                />
              </div>

              <button className="border px-4 rounded-lg flex items-center gap-2">
                <Filter size={16} />
                Filter
              </button>

              <input
                type="text"
                value="01/01/2024 - 31/12/2024"
                readOnly
                className="border rounded-lg px-4"
              />
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="p-4">Date</th>
                  <th>Credit Note #</th>
                  <th>Reference #</th>
                  <th>Customer</th>
                  <th>Invoice #</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr
                    key={row}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="p-4">07-Nov-2019</td>
                    <td className="text-blue-600">
                      CN-God-0000{row}
                    </td>
                    <td>14201268{row}</td>
                    <td>Godrej & Boyce</td>
                    <td>18/GB/050715</td>

                    <td>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        DRAFT
                      </span>
                    </td>

                    <td>₹3,380.00</td>

                    <td>
                      <MoreVertical size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview Panel */}
          <div className="col-span-5 bg-white rounded-xl border p-5">

            <h2 className="font-semibold text-xl mb-5">
              Credit Note Preview
            </h2>

            <div className="border rounded-lg p-5">

              <div className="flex justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-blue-600">
                    nido
                  </h3>

                  <p className="text-sm text-slate-600 mt-2">
                    Nido Technologies Pvt. Ltd.
                  </p>

                  <p className="text-sm text-slate-500">
                    Bengaluru, India
                  </p>
                </div>

                <div className="text-right">
                  <h3 className="font-bold text-2xl">
                    CREDIT NOTE
                  </h3>

                  <p className="mt-2">
                    CN-God-00002
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold">
                  BILL TO
                </h4>

                <p className="mt-2">
                  Godrej & Boyce Mfg. Co. Ltd.
                </p>

                <p className="text-sm text-slate-500">
                  Goa, India
                </p>
              </div>

              <div className="mt-6 border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-2">Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td className="p-2">
                        MRT-113-24-G1
                      </td>
                      <td>1</td>
                      <td>3380</td>
                      <td>3380</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹3,380.00</span>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹3,380.00</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="text-3xl font-bold mt-2">
        {value}
      </h3>
    </div>
  );
}