import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CircleHelp, RotateCcw, Save, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import AssignmentHistory from "./AssignmentHistory";
import TierConfiguration from "./TierConfiguration";
import {
  CLIENT_TIERS,
  EMPLOYEES,
  MOCK_CLIENTS,
  createDefaultDemoState,
  createReassignment,
  getEmployee,
  getNextAssignments,
  loadDemoState,
  persistDemoState,
  simulateNext,
  type ClientTier,
  type DemoState,
  type TierConfig,
} from "./model";

function sameTierRules(left: TierConfig, right: TierConfig) {
  return left.enabled === right.enabled
    && left.tier === right.tier
    && left.fallback === right.fallback
    && JSON.stringify(left.eligibleEmployeeIds) === JSON.stringify(right.eligibleEmployeeIds)
    && JSON.stringify(left.sequence) === JSON.stringify(right.sequence);
}

function statusMessageFor(error: unknown) {
  return error instanceof Error && error.name === "QuotaExceededError"
    ? "Browser storage is full. This update is visible in this tab but was not saved."
    : "Browser storage is unavailable. This update is visible in this tab only; it was not saved.";
}

export default function AutoAssignmentDemo() {
  const [boot] = useState(() => loadDemoState());
  const [state, setState] = useState<DemoState>(boot.state);
  const [draft, setDraft] = useState(() => ({
    enabled: boot.state.enabled,
    tiers: { ...boot.state.tiers },
  }));
  const [notice, setNotice] = useState(boot.error);
  const [noticeKind, setNoticeKind] = useState<"error" | "success" | "warning">(boot.error ? "error" : "success");
  const [needsPersistence, setNeedsPersistence] = useState(Boolean(boot.error));
  const [selectedTier, setSelectedTier] = useState<ClientTier>("Premium");
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);
  const [resetOpen, setResetOpen] = useState(false);

  const configDirty = draft.enabled !== state.enabled || CLIENT_TIERS.some((tier) =>
    JSON.stringify(draft.tiers[tier]) !== JSON.stringify(state.tiers[tier]),
  );
  const canSave = configDirty || needsPersistence;
  const availableClients = useMemo(
    () => MOCK_CLIENTS.filter((client) => client.tier === selectedTier),
    [selectedTier],
  );
  const selectedClient = availableClients.find((client) => client.id === selectedClientId) ?? availableClients[0];
  const activeEligibleIds = new Set(CLIENT_TIERS.flatMap((tier) =>
    state.tiers[tier].enabled
      ? state.tiers[tier].eligibleEmployeeIds.filter((employeeId) => getEmployee(employeeId)?.status === "Active")
      : [],
  ));
  const assignedCount = state.history.filter((item) => !!item.assignedEmployeeId).length;
  const unassignedCount = state.history.filter((item) => !item.assignedEmployeeId).length;
  const configuredCount = CLIENT_TIERS.filter((tier) => state.tiers[tier].enabled).length;

  const commit = (next: DemoState, success: string) => {
    setState(next);
    try {
      persistDemoState(next);
      setNeedsPersistence(false);
      setNotice(success);
      setNoticeKind("success");
    } catch (error) {
      setNeedsPersistence(true);
      setNotice(statusMessageFor(error));
      setNoticeKind("error");
    }
  };

  const updateDraftTier = (tier: ClientTier, config: TierConfig) => {
    setDraft((current) => ({ ...current, tiers: { ...current.tiers, [tier]: config } }));
  };

  const saveConfiguration = () => {
    const next: DemoState = {
      ...state,
      enabled: draft.enabled,
      tiers: { ...draft.tiers },
    };
    const hasEmptyEnabledTier = next.enabled && CLIENT_TIERS.some((tier) =>
      next.tiers[tier].enabled && !next.tiers[tier].sequence.some((id) => getEmployee(id)?.status === "Active"),
    );
    setState(next);
    setDraft({ enabled: next.enabled, tiers: { ...next.tiers } });
    try {
      persistDemoState(next);
      setNeedsPersistence(false);
      setNotice(hasEmptyEnabledTier
        ? "Configuration saved in this browser. One or more enabled tiers have no active employee; fallback or unassigned handling will apply."
        : "Configuration saved in this browser only. No backend was changed.");
      setNoticeKind(hasEmptyEnabledTier ? "warning" : "success");
    } catch (error) {
      setNeedsPersistence(true);
      setNotice(statusMessageFor(error));
      setNoticeKind("error");
    }
  };

  const cancelConfiguration = () => {
    setDraft({ enabled: state.enabled, tiers: { ...state.tiers } });
    setNotice("Unsaved configuration changes were discarded.");
    setNoticeKind("success");
  };

  const runSimulation = () => {
    if (!selectedClient) return;
    const { nextState, message } = simulateNext(state, selectedClient);
    setDraft((current) => {
      const previousConfig = state.tiers[selectedClient.tier];
      const draftConfig = current.tiers[selectedClient.tier];
      return sameTierRules(draftConfig, previousConfig)
        ? { ...current, tiers: { ...current.tiers, [selectedClient.tier]: nextState.tiers[selectedClient.tier] } }
        : current;
    });
    commit(nextState, message);
  };

  const manualReassign = (orderId: string, employeeId: string, reason: string) => {
    const next = createReassignment(state, orderId, employeeId, reason);
    commit(next, `Demo reassignment recorded for ${orderId}.`);
  };

  const resetDemo = () => {
    const defaults = createDefaultDemoState();
    setDraft({ enabled: defaults.enabled, tiers: { ...defaults.tiers } });
    setResetOpen(false);
    commit(defaults, "Demo data reset in this browser.");
  };

  const formatEmployee = (id: string | null) => getEmployee(id)?.name ?? "Unassigned";

  return (
    <div className="space-y-5 pb-8">
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-white shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-sky-900/40 to-transparent md:block" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-300/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                <Sparkles className="h-3 w-3" /> Demo environment
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Administration / Order Assignment / Auto Assignment Configuration</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Order assignment control</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Configure tier-specific rotation, then test the next assignment against mock clients and employees.
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200/20 bg-amber-200/[0.08] px-3 py-2 text-xs leading-relaxed text-amber-100">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
              <span><strong className="font-semibold">Demo Mode — Changes are not saved to a backend.</strong> Data is mock-only and may be reset at any time.</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:min-w-[265px] sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
            <div className="flex flex-1 items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Auto Assignment</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{draft.enabled ? "Master rule enabled" : "Master rule paused"}</p>
              </div>
              <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft((current) => ({ ...current, enabled: checked }))} aria-label="Enable master auto assignment rule" />
            </div>
            <div className="flex gap-2 border-t border-white/10 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-3">
              <Button type="button" onClick={saveConfiguration} disabled={!canSave} className="h-9 flex-1 bg-sky-600 text-xs text-white hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400">
                <Save className="mr-2 h-3.5 w-3.5" /> Save changes
              </Button>
              <Button type="button" onClick={cancelConfiguration} disabled={!configDirty} variant="outline" className="h-9 border-white/15 bg-transparent px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-40">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div role={noticeKind === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed ${
          noticeKind === "error" ? "border-rose-200 bg-rose-50 text-rose-800"
            : noticeKind === "warning" ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}>
          {noticeKind === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{notice}</span>
        </div>
      )}

      {configDirty && (
        <p className="flex items-center gap-2 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-900">
          <CircleHelp className="h-4 w-4 shrink-0" /> Configuration edits are drafts. Save them before running a test to use the updated rules.
        </p>
      )}

      <section aria-label="Assignment overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Enabled tiers", value: `${configuredCount} / 3`, note: state.enabled ? "Master rule is on" : "Master rule is paused", color: "text-sky-800", marker: "bg-sky-600" },
          { label: "Eligible employees", value: String(activeEligibleIds.size).padStart(2, "0"), note: "Unique active employees in enabled tiers", color: "text-indigo-800", marker: "bg-indigo-600" },
          { label: "Assigned demo orders", value: String(assignedCount).padStart(2, "0"), note: "Mock + simulated history", color: "text-emerald-800", marker: "bg-emerald-600" },
          { label: "Unassigned demo orders", value: String(unassignedCount).padStart(2, "0"), note: "No active route or rule available", color: "text-amber-800", marker: "bg-amber-600" },
        ].map((metric) => (
          <Card key={metric.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <span className={`mt-1 h-8 w-1 rounded-full ${metric.marker}`} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`font-mono text-2xl font-semibold tracking-tight ${metric.color}`}>{metric.value}</span>
                  <span className="truncate text-[10px] text-slate-400">{metric.note}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-label="Tier configuration">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">01 / Configuration</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Tier-specific rules</h2>
          </div>
          <p className="text-xs text-slate-500">Each tier keeps an independent sequence and rotation position.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {CLIENT_TIERS.map((tier) => (
            <TierConfiguration key={tier} config={draft.tiers[tier]} employees={EMPLOYEES} onChange={(config) => updateDraftTier(tier, config)} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">02 / Preview</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Next five assignments</h2>
            <p className="mt-1 text-xs text-slate-500">Preview reads from saved rules only. It never changes rotation position.</p>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-3">
            {CLIENT_TIERS.map((tier) => {
              const config = state.tiers[tier];
              const preview = state.enabled && config.enabled
                ? getNextAssignments(config, 5)
                : Array.from({ length: 5 }, (_, index) => ({ sequence: index + 1, employeeId: null, method: "Unassigned" as const }));
              return (
                <div key={tier} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5">
                    <span className="text-xs font-semibold text-slate-800">{tier}</span>
                    <Badge variant="outline" className={`h-5 text-[9px] font-medium ${config.enabled && state.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
                      {state.enabled && config.enabled ? "RULE ON" : "PAUSED"}
                    </Badge>
                  </div>
                  <ol>
                    {preview.map((entry) => (
                      <li key={`${tier}-${entry.sequence}`} className="flex items-center gap-2 border-t border-slate-100 px-3 py-2 text-xs">
                        <span className="w-5 font-mono text-[10px] text-slate-400">{String(entry.sequence).padStart(2, "0")}</span>
                        <span className={`min-w-0 flex-1 truncate font-medium ${entry.employeeId ? "text-slate-700" : "text-amber-700"}`}>{formatEmployee(entry.employeeId)}</span>
                        <span className="shrink-0 text-[9px] text-slate-400">{entry.method}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
                    Position {config.sequence.length ? `${config.rotationPosition + 1} of ${config.sequence.length}` : "not set"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">03 / Test bench</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Simulate an order</h2>
            <p className="mt-1 text-xs text-slate-500">Create a mock order and advance only its tier’s saved rotation.</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="simulation-tier" className="mb-1.5 block text-xs font-medium text-slate-700">Client tier</label>
                <select
                  id="simulation-tier"
                  value={selectedTier}
                  onChange={(event) => {
                    const tier = event.target.value as ClientTier;
                    setSelectedTier(tier);
                    setSelectedClientId(MOCK_CLIENTS.find((client) => client.tier === tier)?.id ?? "");
                  }}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
                >
                  {CLIENT_TIERS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="simulation-client" className="mb-1.5 block text-xs font-medium text-slate-700">Mock client</label>
                <select id="simulation-client" value={selectedClient?.id ?? ""} onChange={(event) => setSelectedClientId(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700">
                  {availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                <Zap className="h-4 w-4" /> Assignment rule check
              </div>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-sky-900/75">
                <li>Serial round robin checks the saved order, skipping inactive employees.</li>
                <li>Rotation advances only after a successful round-robin assignment.</li>
                <li>Fallback assignments and unassigned orders do not advance the sequence.</li>
              </ul>
            </div>
            <Button type="button" onClick={runSimulation} disabled={!selectedClient} className="h-10 w-full bg-sky-800 text-xs font-semibold text-white hover:bg-sky-900">
              Simulate new order <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-slate-400">Creates a local demo history row only. No client order or employee assignment is made.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">Assignment behavior</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Rules at a glance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Serial rotation", "Moves through each tier’s saved employee sequence in order."],
              ["02", "Inactive employees", "Skipped during selection; they remain visible in configuration."],
              ["03", "Fallback handling", "Uses the selected fallback, or records an unassigned demo order."],
            ].map(([number, title, description]) => (
              <div key={number} className="border-l-2 border-sky-200 pl-3">
                <span className="font-mono text-[10px] text-sky-700">{number}</span>
                <h3 className="mt-1 text-xs font-semibold text-slate-800">{title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-5">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">Local demo data</p>
            <h2 className="mt-1 text-base font-semibold text-amber-950">Reset this workspace</h2>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/75">Restore sample rules and history in this browser. This does not affect NIDO’s operational order or service assignment settings.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setResetOpen(true)} className="h-9 self-start border-amber-300 bg-white text-xs text-amber-900 hover:bg-amber-100">
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset demo data
          </Button>
        </div>
      </section>

      <AssignmentHistory history={state.history} onReassign={manualReassign} />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset demo assignment data?</DialogTitle>
            <DialogDescription>
              This restores the sample tier rules and mock history, and removes simulated orders and reassignments from this browser’s demo workspace. Operational order and service assignment data is not touched.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            This action cannot be undone for this demo session.
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>Keep demo data</Button>
            <Button type="button" onClick={resetDemo} className="bg-amber-800 text-white hover:bg-amber-900">
              Reset demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
