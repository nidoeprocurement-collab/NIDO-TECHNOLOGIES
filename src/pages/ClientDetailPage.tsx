"use client";

import { useState } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Icons
import {
  Mail,
  Phone,
  MapPin,
  Download,
  ShoppingCart,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";

// Charts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ================= TYPES ================= */

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
};

type ClientDetailProps = {
  client: Client;
  onBack: () => void;
};

/* ================= DATA ================= */

const spendingData = [
  { month: "Jan", amount: 12000 },
  { month: "Feb", amount: 18000 },
  { month: "Mar", amount: 15000 },
  { month: "Apr", amount: 22000 },
  { month: "May", amount: 17000 },
];

const spendCategories = [
  { name: "Hardware", value: 45, color: "#2563EB" },
  { name: "Software", value: 30, color: "#7C3AED" },
  { name: "Service", value: 15, color: "#059669" },
  { name: "Other", value: 10, color: "#D97706" },
];

/* ================= PAGE ================= */

export default function ClientDetailPage({
  client,
  onBack,
}: ClientDetailProps) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            Client Details Dashboard
          </p>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard icon={<Mail />} label="Email" value={client.email || "-"} />
        <InfoCard icon={<Phone />} label="Phone" value={client.phone || "-"} />
        <InfoCard
          icon={<MapPin />}
          label="Location"
          value={client.location || "-"}
        />
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            {/* BAR CHART */}
            <div className="p-4 border rounded-xl">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Monthly Spending
              </h2>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PIE CHART */}
            <div className="p-4 border rounded-xl">
              <h2 className="font-semibold mb-4">
                Spending Distribution
              </h2>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendCategories}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                  >
                    {spendCategories.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          <div className="p-6 border rounded-xl text-center">
            <ShoppingCart className="mx-auto mb-3" />
            <p>No orders available</p>
          </div>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics">
          <div className="p-6 border rounded-xl text-center">
            <Download className="mx-auto mb-3" />
            <p>Analytics coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ================= COMPONENT ================= */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-xl">
      <div className="p-2 bg-muted rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}