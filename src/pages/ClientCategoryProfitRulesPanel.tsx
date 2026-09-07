import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getClientCategoryProfitRules,
  saveClientCategoryProfitRules,
  type ClientCategoryProfitRule,
} from "@/lib/priceEngineStore";

export default function ClientCategoryProfitRulesPanel({ clientId }: { clientId: string }) {
  const [rules, setRules] = useState<ClientCategoryProfitRule[]>(() => getClientCategoryProfitRules(clientId));

  useEffect(() => {
    setRules(getClientCategoryProfitRules(clientId));
  }, [clientId]);

  const updateRule = (category: string, patch: Partial<ClientCategoryProfitRule>) => {
    const next = rules.map((rule) => (
      rule.category === category ? { ...rule, ...patch } : rule
    ));
    setRules(next);
    saveClientCategoryProfitRules(clientId, next);
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800">Category Profit Rules</h3>
      <p className="mt-1 text-[10px] text-gray-500">
        Change the profit percentage used for products in a specific category. These rules take priority over the
        client&apos;s default Profit Margin.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] text-blue-700">
        <Info size={12} className="shrink-0" />
        <span>
          For the product currently showing 18%, edit the <strong>Software</strong> row below or turn it off to use the
          client&apos;s default Profit Margin instead.
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Profit Margin</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.category} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-medium text-gray-800">{rule.category}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={rule.profitPct || ""}
                      onChange={(event) => updateRule(rule.category, {
                        profitPct: Math.min(100, Math.max(0, parseFloat(event.target.value) || 0)),
                      })}
                      className="h-8 w-24 bg-white text-xs"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    aria-pressed={rule.enabled}
                    onClick={() => updateRule(rule.category, { enabled: !rule.enabled })}
                    className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                      rule.enabled
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 bg-gray-100 text-gray-500"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}