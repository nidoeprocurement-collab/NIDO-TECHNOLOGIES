import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number; // percent change, positive=good, negative=bad
  icon: React.ReactNode;
  iconBg?: string;
  sparkline?: number[];
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

export default function KpiCard({
  title,
  value,
  change,
  icon,
  iconBg = "bg-blue-50",
  sparkline,
  prefix = "",
  suffix = "",
  loading = false,
}: KpiCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change > 0;
  const isNeutral = hasChange && change === 0;

  const sparkData = sparkline?.map((v, i) => ({ i, v })) ?? [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        {hasChange && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            isNeutral ? "text-gray-500" : isPositive ? "text-emerald-600" : "text-red-500"
          }`}>
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change).toFixed(1)}% vs last period
          </div>
        )}

        {sparkline && sparkline.length > 1 && (
          <div className="w-20 h-8 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={isPositive || !hasChange ? "#2563EB" : "#EF4444"}
                  strokeWidth={1.5}
                  dot={false}
                />
                <Tooltip
                  content={() => null}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
