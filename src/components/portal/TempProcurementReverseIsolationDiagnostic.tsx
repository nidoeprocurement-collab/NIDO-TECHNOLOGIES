import { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { isDevelopmentEnvironment } from "@/components/portal/TempViewerIsolationDiagnostic";

const SURAJ_TECH_CLIENT_ID = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
const BETA_CORP_CLIENT_ID = "383a71f8-1d78-4454-8c5b-631374e3cac0";

type DiagnosticOutcome = "PASS" | "FAIL" | "ERROR";

interface ReverseDiagnosticResult {
  testName: string;
  outcome: DiagnosticOutcome;
  statusText: string;
  rowCount: number;
  errorMessage: string | null;
}

export function isSurajProcurementEligible(params: {
  isAuthenticated: boolean;
  isImpersonating: boolean;
  userType?: string;
  clientId?: string;
  role?: string;
}): boolean {
  if (!isDevelopmentEnvironment()) return false;
  if (!params.isAuthenticated || params.isImpersonating) return false;
  if (params.clientId?.trim() !== SURAJ_TECH_CLIENT_ID) return false;
  if (params.userType !== "client_user") return false;
  return (params.role ?? "").trim().toLowerCase() === "procurement";
}

export default function TempProcurementReverseIsolationDiagnostic() {
  const { isAuthenticated, isImpersonating, user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReverseDiagnosticResult | null>(null);

  const eligible = isSurajProcurementEligible({
    isAuthenticated,
    isImpersonating,
    userType: user?.userType,
    clientId: user?.clientId,
    role: user?.role,
  });

  if (!eligible) {
    return null;
  }

  const runTest = async () => {
    const testName =
      "Cross-Tenant Organization Read (Suraj Technologie Procurement -> Beta Corp)";
    setRunning(true);

    try {
      const { data: ctx, error: ctxError, status: ctxStatus } = await supabase.rpc(
        "get_my_auth_context",
      );

      const authCtx = ctx as {
        authenticated?: boolean;
        user_scope?: string;
        profile?: { client_id?: string | null; user_type?: string | null };
        role?: { name?: string | null };
      } | null;

      if (
        ctxError ||
        authCtx?.authenticated !== true ||
        authCtx?.user_scope !== "client_portal" ||
        authCtx?.profile?.client_id !== SURAJ_TECH_CLIENT_ID ||
        authCtx?.profile?.user_type !== "client_user" ||
        String(authCtx?.role?.name ?? "").trim().toLowerCase() !== "procurement"
      ) {
        setResult({
          testName,
          outcome: "ERROR",
          statusText: `HTTP ${ctxStatus ?? "N/A"}${ctxError?.code ? ` (${ctxError.code})` : ""}`,
          rowCount: 0,
          errorMessage:
            ctxError?.message ??
            "Authenticated profile did not match Suraj Technologie Procurement.",
        });
        return;
      }

      const { data, error, status } = await supabase
        .from("client_organizations")
        .select("id, client_code")
        .eq("id", BETA_CORP_CLIENT_ID);

      if (error || !Array.isArray(data)) {
        setResult({
          testName,
          outcome: "ERROR",
          statusText: `HTTP ${status ?? "N/A"}${error?.code ? ` (${error.code})` : ""}`,
          rowCount: 0,
          errorMessage: error?.message ?? "Query did not return a valid result array.",
        });
        return;
      }

      const rowCount = data.length;
      setResult({
        testName,
        outcome: rowCount === 0 ? "PASS" : "FAIL",
        statusText: `HTTP ${status ?? 200}`,
        rowCount,
        errorMessage:
          rowCount === 0
            ? null
            : "Tenant isolation failed: Beta Corp row count was greater than 0.",
      });
    } catch (err) {
      setResult({
        testName,
        outcome: "ERROR",
        statusText: "Request Error",
        rowCount: 0,
        errorMessage:
          err instanceof Error ? err.message : "Unexpected error executing reverse isolation test.",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section
      aria-label="Temporary Security Diagnostic â€“ Reverse Tenant Isolation"
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-amber-950">
            Temporary Security Diagnostic â€“ Reverse Tenant Isolation
          </h2>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Read-only verification that Suraj Technologie Procurement cannot read Beta Corp from{" "}
            <code>public.client_organizations</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={running}
          className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {running ? "Running..." : "Run Reverse Tenant Isolation Test"}
        </button>
      </div>

      {result && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-gray-900">{result.testName}</span>
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                result.outcome === "PASS"
                  ? "bg-emerald-100 text-emerald-800"
                  : result.outcome === "FAIL"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {result.outcome === "PASS" ? (
                <ShieldCheck size={13} />
              ) : result.outcome === "FAIL" ? (
                <ShieldAlert size={13} />
              ) : (
                <AlertTriangle size={13} />
              )}
              {result.outcome}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600 sm:grid-cols-3">
            <div>
              <span className="font-medium text-gray-500">HTTP Status: </span>
              <span className="font-semibold text-gray-900">{result.statusText}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Rows returned: </span>
              <span className="font-semibold text-gray-900">{result.rowCount}</span>
            </div>
          </div>
          {result.errorMessage && (
            <p className="mt-2 text-[11px] text-red-700">{result.errorMessage}</p>
          )}
        </div>
      )}
    </section>
  );
}
