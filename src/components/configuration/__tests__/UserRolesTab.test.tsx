import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { BUILTIN_REFERENCE_ROLE_NAMES } from "@/lib/rbacFrontendImport";
import NidoUsersPage from "../UserRolesTab";

const SYSTEM_OWNER_UUID = "00000000-0000-4000-8000-000000000001";
const PROCUREMENT_UUID = "11111111-1111-4111-8111-111111111111";
const CUSTOM_ROLE_UUID = "22222222-2222-4222-8222-222222222222";

describe("UserRolesTab Supabase-backed role & permission synchronization", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("auto-syncs missing built-in reference roles even when a custom role already exists, and protects System Owner", async () => {
    let rolesDb = [
      {
        id: SYSTEM_OWNER_UUID,
        name: "System Owner",
        department: "Administration",
        description: "Full platform owner",
        status: "Active",
        is_system_owner: true,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Existing Custom Role",
        department: "Custom Dept",
        description: "Pre-existing custom role",
        status: "Active",
        is_system_owner: false,
      },
    ];
    let permsDb: Array<Record<string, unknown>> = [];

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => ({
      select: vi.fn().mockImplementation(async () => {
        if (table === "nido_roles") return { data: rolesDb, error: null };
        if (table === "nido_role_permissions") return { data: permsDb, error: null };
        return { data: [], error: null };
      }),
    }));

    const invokeMock = vi.fn().mockImplementation(async (_fn: string, { body }: { body: Record<string, unknown> }) => {
      if (body.action === "sync_reference_roles") {
        rolesDb = [
          ...rolesDb,
          {
            id: PROCUREMENT_UUID,
            name: "Procurement Manager",
            department: "Procurement",
            description: "Manages procurement",
            status: "Active",
            is_system_owner: false,
          },
        ];
        permsDb = [
          {
            role_id: PROCUREMENT_UUID,
            module_key: "dashboard",
            can_view: true,
          },
        ];
        return { data: { success: true, result: { inserted_roles: 24 } }, error: null };
      }
      return { data: { success: true }, error: null };
    });

    (supabase as unknown as { functions: { invoke: unknown } }).functions = {
      invoke: invokeMock,
    };

    render(
      <MemoryRouter>
        <NidoUsersPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("manage-nido-roles", {
        body: { action: "sync_reference_roles" },
      });
    });

    expect(await screen.findByText("Procurement Manager")).toBeTruthy();
    expect(screen.getByText("Existing Custom Role")).toBeTruthy();
    expect(screen.getByText("System Owner")).toBeTruthy();

    // System Owner row buttons must be disabled
    const sysOwnerRow = screen.getByText("System Owner").closest("tr")!;
    const editBtn = sysOwnerRow.querySelectorAll("button")[2] as HTMLButtonElement; // [0]=name link, [1]=Permissions, [2]=Edit, [3]=Delete
    const deleteBtn = sysOwnerRow.querySelectorAll("button")[3] as HTMLButtonElement;
    expect(editBtn.disabled).toBe(true);
    expect(deleteBtn.disabled).toBe(true);
  });

  it("creates, edits, and deletes a custom role via manage-nido-roles without re-syncing when all 24 built-in roles exist", async () => {
    let rolesDb = [
      {
        id: SYSTEM_OWNER_UUID,
        name: "System Owner",
        department: "Administration",
        description: "Full platform owner",
        status: "Active",
        is_system_owner: true,
      },
      ...BUILTIN_REFERENCE_ROLE_NAMES.map((name, idx) => ({
        id: idx === 0 ? PROCUREMENT_UUID : `11111111-1111-4111-8111-${String(idx + 10).padStart(12, "0")}`,
        name,
        department: "Built-in",
        description: `${name} role`,
        status: "Active" as const,
        is_system_owner: false,
      })),
    ];

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => ({
      select: vi.fn().mockImplementation(async () => {
        if (table === "nido_roles") return { data: rolesDb, error: null };
        if (table === "nido_role_permissions") return { data: [], error: null };
        return { data: [], error: null };
      }),
    }));

    const invokeMock = vi.fn().mockImplementation(async (_fn: string, { body }: { body: Record<string, unknown> }) => {
      if (body.action === "create_role") {
        const created = {
          id: CUSTOM_ROLE_UUID,
          name: String(body.name),
          department: String(body.department ?? ""),
          description: String(body.description ?? ""),
          status: body.status === "Inactive" ? "Inactive" : "Active",
          is_system_owner: false,
        };
        rolesDb = [...rolesDb, created];
        return { data: { success: true, role: created }, error: null };
      }
      if (body.action === "update_role") {
        rolesDb = rolesDb.map((r) =>
          r.id === body.role_id
            ? {
              ...r,
              name: String(body.name),
              department: String(body.department ?? ""),
              description: String(body.description ?? ""),
              status: body.status === "Inactive" ? "Inactive" : "Active",
            }
            : r,
        );
        const updated = rolesDb.find((r) => r.id === body.role_id);
        return { data: { success: true, role: updated }, error: null };
      }
      if (body.action === "save_role_permissions") {
        return { data: { success: true }, error: null };
      }
      if (body.action === "delete_role") {
        rolesDb = rolesDb.filter((r) => r.id !== body.role_id);
        return { data: { success: true, deleted_role_id: body.role_id }, error: null };
      }
      return { data: { success: true }, error: null };
    });

    (supabase as unknown as { functions: { invoke: unknown } }).functions = {
      invoke: invokeMock,
    };

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <NidoUsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("System Administrator")).toBeTruthy();
    // Should NOT call sync_reference_roles when all 24 built-in roles already exist
    expect(invokeMock).not.toHaveBeenCalledWith("manage-nido-roles", {
      body: { action: "sync_reference_roles" },
    });

    // Open Add Role from actions menu
    fireEvent.click(screen.getByRole("button", { name: /role and permission actions/i }));
    fireEvent.click(screen.getByRole("button", { name: /add role/i }));

    fireEvent.change(screen.getByPlaceholderText("e.g. Finance"), { target: { value: "Warehouse" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Warehouse Manager"), { target: { value: "Inventory Lead" } });
    fireEvent.change(screen.getByPlaceholderText("What can users with this role do?"), {
      target: { value: "Manages warehouse stock" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add role$/i }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("manage-nido-roles", {
        body: {
          action: "create_role",
          name: "Inventory Lead",
          department: "Warehouse",
          description: "Manages warehouse stock",
          status: "Active",
        },
      });
    });

    fireEvent.change(screen.getByPlaceholderText("Search roles..."), {
      target: { value: "Inventory" },
    });

    expect(await screen.findByText("Inventory Lead")).toBeTruthy();

    // Edit the custom role
    const customRow = screen.getByText("Inventory Lead").closest("tr")!;
    fireEvent.click(customRow.querySelectorAll("button")[2]);
    fireEvent.change(screen.getByPlaceholderText("e.g. Warehouse Manager"), {
      target: { value: "Inventory Supervisor" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("manage-nido-roles", {
        body: {
          action: "update_role",
          role_id: CUSTOM_ROLE_UUID,
          name: "Inventory Supervisor",
          department: "Warehouse",
          description: "Manages warehouse stock",
          status: "Active",
        },
      });
    });

    expect(await screen.findByText("Inventory Supervisor")).toBeTruthy();

    // Delete custom role
    const rowToDelete = screen.getByText("Inventory Supervisor").closest("tr")!;
    fireEvent.click(rowToDelete.querySelectorAll("button")[3]);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("manage-nido-roles", {
        body: {
          action: "delete_role",
          role_id: CUSTOM_ROLE_UUID,
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Inventory Supervisor")).toBeNull();
    });

    confirmSpy.mockRestore();
  }, 15000);

  it("saves role permissions via manage-nido-roles using the role's Supabase UUID", async () => {
    const rolesDb = [
      {
        id: SYSTEM_OWNER_UUID,
        name: "System Owner",
        department: "Administration",
        description: "Full platform owner",
        status: "Active",
        is_system_owner: true,
      },
      {
        id: PROCUREMENT_UUID,
        name: "Procurement Manager",
        department: "Procurement",
        description: "Manages procurement",
        status: "Active",
        is_system_owner: false,
      },
    ];

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => ({
      select: vi.fn().mockImplementation(async () => {
        if (table === "nido_roles") return { data: rolesDb, error: null };
        if (table === "nido_role_permissions") return { data: [], error: null };
        return { data: [], error: null };
      }),
    }));

    const invokeMock = vi.fn().mockResolvedValue({
      data: { success: true },
      error: null,
    });

    (supabase as unknown as { functions: { invoke: unknown } }).functions = {
      invoke: invokeMock,
    };

    render(
      <MemoryRouter>
        <NidoUsersPage />
      </MemoryRouter>,
    );

    const roleText = await screen.findByText("Procurement Manager");
    const row = roleText.closest("tr")!;
    fireEvent.click(row.querySelectorAll("button")[1]);

    expect(await screen.findByText(/Permissions — Procurement Manager/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /save permissions/i }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "manage-nido-roles",
        expect.objectContaining({
          body: expect.objectContaining({
            action: "save_role_permissions",
            role_id: PROCUREMENT_UUID,
          }),
        }),
      );
    });
  }, 30000);
});

