"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const services = [
  {
    id: 1,
    name: "Premium Support",
    description: "24/7 dedicated support team",
    status: "active",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    price: "$999/month",
  },
  {
    id: 2,
    name: "API Access",
    description: "Full REST API access with webhooks",
    status: "active",
    startDate: "2024-02-01",
    endDate: "2024-12-31",
    price: "$599/month",
  },
  {
    id: 3,
    name: "Advanced Analytics",
    description: "Real-time analytics and reporting",
    status: "inactive",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    price: "$299/month",
  },
  {
    id: 4,
    name: "Custom Integration",
    description: "Dedicated integration support",
    status: "active",
    startDate: "2024-03-10",
    endDate: "2026-03-10",
    price: "Custom",
  },
];

export function ClientServicesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Services</h3>
          <p className="text-sm text-slate-600">Subscribed services and add-ons</p>
        </div>
        <Button>Add Service</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                </div>
                <Badge variant={service.status === "active" ? "default" : "secondary"}>
                  {service.status === "active" ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  {service.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Start Date</p>
                  <p className="font-medium">{service.startDate}</p>
                </div>
                <div>
                  <p className="text-slate-600">End Date</p>
                  <p className="font-medium">{service.endDate}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-sm text-slate-600">Pricing</p>
                <p className="font-semibold text-lg">{service.price}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                <Button variant="outline" size="sm" className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
