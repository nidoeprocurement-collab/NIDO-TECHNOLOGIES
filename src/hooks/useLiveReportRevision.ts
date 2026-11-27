import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hydrateAllReportSourcesFromSupabase } from "@/lib/reportsApi";

const REPORT_DATA_EVENTS = [
  "nidoClientsUpdated",
  "nidoVendorsUpdated",
  "nidoSalesOrdersUpdated",
  "nidoInvoicesUpdated",
  "nidoQuotesUpdated",
  "nidoPaymentReceiptsUpdated",
  "nidoUsersUpdated",
  "nidoConfigUsersUpdated",
  "nidoConfigRolesUpdated",
  "supportTicketsUpdated",
  "serviceRequestsUpdated",
  "catalogUpdated",
  "priceEngineSettingsUpdated",
  "vendorProductsUpdated",
  "clientCatalogUpdated",
  "poCreated",
  "poActivityUpdated",
  "orderFulfillmentStatusUpdated",
  "orderNotesUpdated",
  "orderSubItemsUpdated",
  "stockHistoryUpdated",
  "stockThresholdsUpdated",
  "taxEngineUpdated",
  "slaEngineUpdated",
  "nidoCustomReportsUpdated",
  "nidoReportRefresh",
];

/** Re-read report sources when their local stores change, including across tabs. */
export function useLiveReportRevision(): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((current) => current + 1);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    REPORT_DATA_EVENTS.forEach((eventName) => window.addEventListener(eventName, refresh));

    try {
      if (typeof (supabase as { auth?: { getSession?: unknown } })?.auth?.getSession === "function") {
        void supabase.auth.getSession().then(({ data }) => {
          if (data?.session?.user?.id) {
            void hydrateAllReportSourcesFromSupabase().catch(() => {});
          }
        });
      }
    } catch {
      // ignore in offline/test mode
    }

    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      REPORT_DATA_EVENTS.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, []);

  return revision;
}
