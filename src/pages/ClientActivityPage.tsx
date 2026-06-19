import { useState } from "react";
import { Calendar, User, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  {
    id: 1,
    type: "order_created",
    title: "Purchase Order Created",
    description: "Order PO-2026-001234 was created",
    user: "John Doe",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "user_added",
    title: "New User Added",
    description: "Sarah Johnson was added as Manager",
    user: "Admin",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    type: "invoice_sent",
    title: "Invoice Sent",
    description: "Invoice INV-2026-1001 sent for approval",
    user: "Finance Team",
    timestamp: "1 day ago",
  },
  {
    id: 4,
    type: "contract_updated",
    title: "Contract Updated",
    description: "Service contract renewed for 2 years",
    user: "Legal Team",
    timestamp: "2 days ago",
  },
  {
    id: 5,
    type: "payment_received",
    title: "Payment Received",
    description: "$50,000 payment received",
    user: "Finance",
    timestamp: "3 days ago",
  },
];

const getActivityIcon = (type: string) => {
  const iconClasses = "h-5 w-5";
  switch (type) {
    case "order_created":
      return <FileText className={`${iconClasses} text-blue-500`} />;
    case "user_added":
      return <User className={`${iconClasses} text-green-500`} />;
    case "invoice_sent":
      return <FileText className={`${iconClasses} text-purple-500`} />;
    case "contract_updated":
      return <FileText className={`${iconClasses} text-orange-500`} />;
    case "payment_received":
      return <FileText className={`${iconClasses} text-green-600`} />;
    default:
      return <Clock className={`${iconClasses} text-gray-500`} />;
  }
};

export default function ClientActivityPage() {
  const [activityList] = useState(activities);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-slate-600 mt-1">Timeline of all client activities and events</p>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {activityList.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{activity.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
