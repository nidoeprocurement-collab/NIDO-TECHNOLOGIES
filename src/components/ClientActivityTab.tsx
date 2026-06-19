"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Activity, FileText, Users, Settings, ShoppingCart, Zap } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "order",
    title: "Order Created",
    description: "New order #ORD-2024-001 was created",
    user: "John Doe",
    timestamp: "2 hours ago",
    icon: ShoppingCart,
  },
  {
    id: 2,
    type: "user",
    title: "User Added",
    description: "Sarah Smith was added as Manager",
    user: "Admin User",
    timestamp: "5 hours ago",
    icon: Users,
  },
  {
    id: 3,
    type: "settings",
    title: "Settings Updated",
    description: "Client profile information was modified",
    user: "John Doe",
    timestamp: "1 day ago",
    icon: Settings,
  },
  {
    id: 4,
    type: "document",
    title: "Document Uploaded",
    description: "Contract_2024.pdf was uploaded",
    user: "Jane Smith",
    timestamp: "2 days ago",
    icon: FileText,
  },
  {
    id: 5,
    type: "activity",
    title: "Activity Log Exported",
    description: "Monthly activity report was exported",
    user: "Admin User",
    timestamp: "3 days ago",
    icon: Activity,
  },
  {
    id: 6,
    type: "integration",
    title: "Integration Connected",
    description: "Stripe payment gateway integration was enabled",
    user: "System",
    timestamp: "5 days ago",
    icon: Zap,
  },
];

export function ClientActivityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <p className="text-sm text-slate-600">Track all events and changes for this client</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const IconComponent = activity.icon;
          return (
            <Card key={activity.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                      </div>
                      <p className="text-xs text-slate-500 whitespace-nowrap ml-2">{activity.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-slate-500">By:</span>
                      <span className="text-xs font-medium text-slate-700">{activity.user}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
