import { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const BETA_CORP_CLIENT_ID = "383a71f8-1d78-4454-8c5b-631374e3cac0";
const SURAJ_TECH_CLIENT_ID = "c04422ca-3d89-41c2-846d-1ae95a2b3a57";
const NIDO_DEV_PROJECT_REF = "eicjhhmkpqcnmwrfztit";

type DiagnosticOutcome = "PASS" | "FAIL" | "ERROR";

interface DiagnosticResult {
  testName: string;
  outcome: DiagnosticOutcome;
  statusText: string;
  rowCount: number;
  explanation: string;
}

export function isDevelopmentEnvironment(): boolean {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "");
  return import.meta.env.DEV || supabaseUrl.includes(NIDO_DEV_PROJECT_REF);
}

export function isBetaCorpViewerEligible(params: {
  isAuthenticated: boolean;
  isImpersonating: boolean;
  userType?: string;
  clientId?: string;
  role?: string;
}): boolean {
  if (!isDevelopmentEnvironment()) return false;
  if (!params.isAuthenticated || params.isImpersonating) return false;
  if (params.clientId?.trim() !== BETA_CORP_CLIENT_ID) return false;
  if (params.userType !== "client_user") return false;
  return (params.role ?? "").trim().toLowerCase() === "viewer";
}

export default function TempViewerIsolationDiagnostic() {
  const { isAuthenticated, isImpersonating, user } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const eligible = isBetaCorpViewerEligible({
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
    if (
      !isBetaCorpViewerEligible({
        isAuthenticated,
        isImpersonating,
        userType: user?.userType,
        clientId: user?.clientId,
        role: user?.role,
      })
    ) {
      return;
    }

    setRunning(true);
    const testName = "Cross-Tenant Organization Read (Beta Corp Viewer -> Suraj Technologie)";

    try {
      const { data, error, status } = await supabase
        .from("client_organizations")
        .select("id, client_code")
        .eq("id", SURAJ_TECH_CLIENT_ID);

      if (error || !Array.isArray(data)) {
        setResult({
          testName,
          outcome: "ERROR",
          statusText: `HTTP ${status ?? "N/A"}${error?.code ? ` (${error.code})` : ""}`,
          rowCount: 0,
          explanation: error?.message
            ? `Query returned an error: ${error.message}`
            : "Query did not return a valid result array.",
        });
        return;
      }

      const rowCount = data.length;
      if (rowCount === 0) {
        setResult({
          testName,
          outcome: "PASS",
          statusText: `HTTP ${status ?? 200}`,
          rowCount: 0,
          explanation:
            "Query succeeded with 0 rows returned. RLS prevented access to Suraj Technologie.",
        });
      } else {
        setResult({
          testName,
          outcome: "FAIL",
          statusText: `HTTP ${status ?? 200}`,
          rowCount,
          explanation:
            "Tenant isolation failed: another client organization's row count was greater than 0.",
        });
      }
    } catch (err) {
      setResult({
        testName,
        outcome: "ERROR",
        statusText: "Request Error",
        rowCount: 0,
        explanation:
          err instanceof Error ? err.message : "Unexpected error executing tenant isolation check.",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section
      aria-label="Temporary Security Diagnostic – Viewer Tenant Isolation"
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-amber-950">
            Temporary Security Diagnostic – Viewer Tenant Isolation
          </h2>
          <p className="mt-0.5 text-[11px] text-amber-800">
            Read-only verification that Beta Corp Viewer cannot read Suraj Technologie from{" "}
            <code>public.client_organizations</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={running}
          className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {running ? "Running..." : "Run Tenant Isolation Test"}
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
              <span className="font-medium text-gray-500">Status: </span>
              <span className="font-semibold text-gray-900">{result.statusText}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Rows returned: </span>
              <span className="font-semibold text-gray-900">{result.rowCount}</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-700">{result.explanation}</p>
        </div>
      )}
    </section>
  );
}
