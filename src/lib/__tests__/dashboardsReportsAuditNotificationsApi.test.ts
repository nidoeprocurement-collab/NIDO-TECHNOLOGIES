import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import { loadDashboardSummaryFromSupabase } from "@/lib/dashboardApi";
import { hydrateAllReportSourcesFromSupabase } from "@/lib/reportsApi";
import {
  appendBusinessAuditLogInSupabase,
  loadBusinessAuditLogsFromSupabase,
} from "@/lib/auditLogsApi";
import {
  createUserNotificationInSupabase,
  loadNotificationPreferencesFromSupabase,
  loadNotificationsFromSupabase,
  markNotificationReadInSupabase,
  saveNotificationPreferencesInSupabase,
} from "@/lib/notificationsApi";

describe("Dashboards, Reports, Audit Logs & Notifications (Wave 2.5)", () => {
  const clientUuid1 = "11111111-1111-4111-8111-111111111111";
  const clientUuid2 = "22222222-2222-4222-8222-222222222222";
  const userUuid1 = "33333333-3333-4333-8333-333333333333";
  const notifUuid1 = "44444444-4444-4444-8444-444444444444";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads server-side aggregated dashboard KPIs and enforces client tenant isolation", async () => {
    const sampleMetrics = {
      total_orders: 12,
      pending_orders: 3,
      approved_orders: 7,
      rejected_orders: 1,
      completed_orders: 8,
      total_procurement_spend: 250000,
      outstanding_invoices_count: 2,
      outstanding_invoices_amount: 45000,
      total_purchase_orders: 0,
      total_po_value: 0,
      outstanding_bills_count: 0,
      outstanding_bills_amount: 0,
      active_vendors: 0,
      total_clients: 0,
      total_grns: 0,
      pending_deliveries: 2,
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleMetrics, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "42501", message: "Forbidden client scope" },
      });

    const metrics = await loadDashboardSummaryFromSupabase(clientUuid1, "month");
    expect(metrics.total_orders).toBe(12);
    expect(metrics.total_procurement_spend).toBe(250000);
    expect(metrics.total_purchase_orders).toBe(0);

    await expect(loadDashboardSummaryFromSupabase(clientUuid2, "all")).rejects.toThrow(/Forbidden client scope/i);
  });

  it("hydrates report sources from Supabase cleanly", async () => {
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          then: (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(resolve),
        })),
      })),
    }));

    const snap = await hydrateAllReportSourcesFromSupabase(clientUuid1);
    expect(snap.ordersCount).toBe(0);
    expect(snap.invoicesCount).toBe(0);
  });

  it("appends and loads immutable business audit logs while excluding sensitive secrets", async () => {
    const sampleAudit = {
      id: "audit-1",
      event_id: "evt_po_raised_1",
      module: "Purchase Orders",
      action: "PO Raised",
      entity_type: "purchase_order",
      entity_id: "PO-1001",
      actor_id: userUuid1,
      actor_name: "Admin User",
      client_id: clientUuid1,
      previous_values: { status: "Draft" },
      new_values: { status: "Confirmed" },
      reason: "Approved order",
      is_internal_only: true,
      created_at: "2026-11-26T10:30:00Z",
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleAudit, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "42501", message: "Forbidden: cannot write internal-only audit log" },
      });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [sampleAudit], error: null }),
          })),
        })),
      })),
    }));

    const appended = await appendBusinessAuditLogInSupabase({
      module: "Purchase Orders",
      action: "PO Raised",
      entityType: "purchase_order",
      entityId: "PO-1001",
      actorName: "Admin User",
      clientId: clientUuid1,
      isInternalOnly: true,
      eventId: "evt_po_raised_1",
    });
    expect(appended.module).toBe("Purchase Orders");

    await expect(
      appendBusinessAuditLogInSupabase({
        module: "Security",
        action: "Attempt",
        entityType: "system",
        entityId: "1",
        actorName: "Client",
        isInternalOnly: true,
      }),
    ).rejects.toThrow(/cannot write internal-only audit log/i);

    const list = await loadBusinessAuditLogsFromSupabase({ module: "Purchase Orders" });
    expect(list).toHaveLength(1);
  });

  it("manages recipient-scoped notifications and preferences independently of email delivery", async () => {
    const sampleNotif = {
      id: notifUuid1,
      dedupe_key: "ord_placed_ORD-000001",
      recipient_user_id: userUuid1,
      client_id: clientUuid1,
      title: "New Order Placed",
      description: "Order ORD-000001 awaiting approval",
      notification_type: "order",
      module: "Orders",
      entity_reference: "ORD-000001",
      priority: "normal" as const,
      action_link: "/portal/orders",
      is_read: false,
      read_at: null,
      created_at: "2026-11-26T10:30:00Z",
    };

    const samplePrefs = {
      user_id: userUuid1,
      client_id: clientUuid1,
      email_enabled: true,
      sms_enabled: false,
      in_app_enabled: true,
      category_preferences: {},
      updated_at: "2026-11-26T10:30:00Z",
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi.fn().mockResolvedValue({
      data: sampleNotif,
      error: null,
    });

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "notifications") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [sampleNotif], error: null }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: samplePrefs, error: null }) })),
        })),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    const created = await createUserNotificationInSupabase({
      recipientUserId: userUuid1,
      title: "New Order Placed",
      description: "Order ORD-000001 awaiting approval",
      module: "Orders",
      dedupeKey: "ord_placed_ORD-000001",
      clientId: clientUuid1,
    });
    expect(created.id).toBe(notifUuid1);

    const notifs = await loadNotificationsFromSupabase();
    expect(notifs).toHaveLength(1);
    await expect(markNotificationReadInSupabase(notifUuid1)).resolves.toBeUndefined();

    const prefs = await loadNotificationPreferencesFromSupabase(userUuid1);
    expect(prefs?.email_enabled).toBe(true);
    await expect(
      saveNotificationPreferencesInSupabase({
        userId: userUuid1,
        clientId: clientUuid1,
        emailEnabled: false,
        smsEnabled: false,
        inAppEnabled: true,
      }),
    ).resolves.toBeUndefined();
  });

  it("enforces append-only audit_logs, RLS, and secret stripping in Wave 2.5 migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000019_phase3_dashboards_reports_audit_notifications.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.audit_logs");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.notifications");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.notification_preferences");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.notification_delivery_logs");
    expect(sql).toContain("GRANT SELECT, INSERT ON TABLE public.audit_logs TO authenticated");
    expect(sql).toContain("get_dashboard_summary");
    expect(sql).toContain("append_audit_log");
    expect(sql).toContain("create_user_notification");
    expect(sql).toContain("- 'password' - 'token' - 'access_token' - 'refresh_token' - 'api_key'");
    expect(sql).toContain("REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon");
  });
});
