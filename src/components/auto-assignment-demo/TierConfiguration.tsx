import { ArrowDown, ArrowUp, RotateCcw, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getEmployee, type Employee, type TierConfig } from "./model";

interface TierConfigurationProps {
  config: TierConfig;
  employees: Employee[];
  onChange: (config: TierConfig) => void;
}

export default function TierConfiguration({ config, employees, onChange }: TierConfigurationProps) {
  const activeEligible = config.sequence.filter((id) =>
    config.eligibleEmployeeIds.includes(id) && getEmployee(id)?.status === "Active",
  ).length;

  const toggleEmployee = (id: string, checked: boolean) => {
    const eligibleEmployeeIds = checked
      ? [...new Set([...config.eligibleEmployeeIds, id])]
      : config.eligibleEmployeeIds.filter((employeeId) => employeeId !== id);
    const sequence = checked
      ? [...config.sequence.filter((employeeId) => employeeId !== id), id]
      : config.sequence.filter((employeeId) => employeeId !== id);
    onChange({
      ...config,
      eligibleEmployeeIds,
      sequence,
      rotationPosition: Math.min(config.rotationPosition, Math.max(0, sequence.length - 1)),
    });
  };

  const moveEmployee = (index: number, direction: -1 | 1) => {
    const next = [...config.sequence];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...config, sequence: next });
  };

  const resetRotation = () => onChange({ ...config, rotationPosition: 0 });
  const currentEmployeeId = config.sequence[config.rotationPosition] ?? null;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardDescription className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                Client tier
              </CardDescription>
              <Badge variant="outline" className="border-slate-200 bg-white font-mono text-[10px] text-slate-500">
                {String(config.sequence.length).padStart(2, "0")} IN SEQUENCE
              </Badge>
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{config.tier}</h3>
          </div>
          <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
            <span>{config.enabled ? "Rule on" : "Rule off"}</span>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onChange({ ...config, enabled: checked })}
              aria-label={`Enable ${config.tier} tier assignment rule`}
            />
          </label>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Serial round robin <span className="px-1 text-slate-300">/</span> {activeEligible} active eligible
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <section aria-label={`${config.tier} eligible employees`}>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-[0.09em] text-slate-700">Eligible employees</h4>
            <span className="text-[11px] text-slate-400">Select who can receive orders</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {employees.map((employee) => {
              const checked = config.eligibleEmployeeIds.includes(employee.id);
              return (
                <label
                  key={employee.id}
                  className={`flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                    checked ? "border-sky-200 bg-sky-50/60" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleEmployee(employee.id, event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sky-700"
                    aria-label={`${checked ? "Remove" : "Add"} ${employee.name} ${checked ? "from" : "to"} ${config.tier} eligible employees`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-slate-800">{employee.name}</span>
                      <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide ${employee.status === "Active" ? "text-emerald-700" : "text-amber-700"}`}>
                        {employee.status}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-500">{employee.employeeId}</span>
                    <span className="mt-1 block truncate text-[10px] text-slate-400">{employee.department} · {employee.role}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section aria-label={`${config.tier} employee sequence`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.09em] text-slate-700">Rotation sequence</h4>
              <Badge variant="secondary" className="h-5 gap-1 bg-slate-100 px-1.5 text-[10px] font-normal text-slate-600">
                <UsersRound className="h-3 w-3" /> {activeEligible} active
              </Badge>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-slate-500" onClick={resetRotation}>
              <RotateCcw className="mr-1 h-3 w-3" /> Reset position
            </Button>
          </div>
          {config.sequence.length ? (
            <ol className="space-y-1.5">
              {config.sequence.map((employeeId, index) => {
                const employee = getEmployee(employeeId);
                const isCurrent = index === config.rotationPosition;
                return (
                  <li key={`${employeeId}-${index}`} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${isCurrent ? "border-sky-200 bg-sky-50/70" : "border-slate-100 bg-slate-50/50"}`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-mono text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-slate-800">{employee?.name ?? "Unknown employee"}</span>
                        {isCurrent && <span className="text-[9px] font-semibold uppercase tracking-wide text-sky-700">Next in rotation</span>}
                        {employee?.status === "Inactive" && <span className="text-[9px] font-medium text-amber-700">Skipped while inactive</span>}
                      </span>
                    </span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => moveEmployee(index, -1)} aria-label={`Move ${employee?.name ?? "employee"} up in ${config.tier} sequence`}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === config.sequence.length - 1} onClick={() => moveEmployee(index, 1)} aria-label={`Move ${employee?.name ?? "employee"} down in ${config.tier} sequence`}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-4 text-center text-xs text-amber-800">
              Add at least one employee to create a rotation sequence.
            </div>
          )}
        </section>

        <section className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Current position</p>
            <p className="mt-1 text-xs font-medium text-slate-800">
              {currentEmployeeId ? `${getEmployee(currentEmployeeId)?.name ?? "Employee"} · #${config.rotationPosition + 1}` : "No position"}
            </p>
          </div>
          <div>
            <label htmlFor={`fallback-${config.tier}`} className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Fallback employee</label>
            <select
              id={`fallback-${config.tier}`}
              value={config.fallback ?? "none"}
              onChange={(event) => onChange({ ...config, fallback: event.target.value === "none" ? null : event.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <option value="none">Leave unassigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}{employee.status === "Inactive" ? " — inactive" : ""}</option>
              ))}
            </select>
          </div>
        </section>
        {!config.enabled && <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">This tier is disabled. Simulated orders will remain unassigned.</p>}
        {config.eligibleEmployeeIds.length > 0 && activeEligible === 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">No active eligible employees. The fallback is used when available; otherwise orders remain unassigned.</p>
        )}
      </CardContent>
    </Card>
  );
}
