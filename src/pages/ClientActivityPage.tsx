import { useState } from "react";
import { ShoppingCart, UserPlus, FileText, Calendar } from "lucide-react";

const activityItems = [
  {
    id: 1,
    title: "New order placed",
    description: <>Order #ORD-2024-1245 for $125,000</>,
    date: "2024-05-28 10:30 AM",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <ShoppingCart size={15} />,
  },
  {
    id: 2,
    title: "User added",
    description: <>Aaron Lee (EMP-001) added as <span className="text-blue-500">Admin</span></>,
    date: "2024-05-25 02:15 PM",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    icon: <UserPlus size={15} />,
  },
  {
    id: 3,
    title: "Contract updated",
    description: <>Contract period extended to <span className="text-blue-500">Dec 2025</span></>,
    date: "2024-05-20 11:00 AM",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    icon: <FileText size={15} />,
  },
];

export default function ActivityPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          View the latest <span className="text-blue-500">updates</span> and <span className="text-blue-500">actions</span> for this client.
        </p>
      </div>

      {/* Timeline */}
      <div className="flex flex-col">
        {activityItems.map((item, i) => (
          <div key={item.id} className="flex gap-4">
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 z-10`}>
                {item.icon}
              </div>
              {i < activityItems.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${i === activityItems.length - 1 ? "pb-2" : ""}`}>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{item.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar size={11} className="text-orange-400 shrink-0" />
                <span className="text-[11px] text-gray-400">{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        <p className="text-[11px] text-gray-500">Showing 1 to {activityItems.length} of {activityItems.length} activities</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40"
          >
            –
          </button>
          <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
