import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: unknown }) => children ?? null,
  AreaChart: () => null,
  Area: () => null,
  BarChart: () => null,
  Bar: () => null,
  LineChart: () => null,
  Line: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ClientUsersPage, {
  USER_TEMPLATE_HEADERS,
  downloadUserTemplate,
} from "@/pages/ClientUsersPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import {
  createPortalRolePermission,
  getPortalUsersByClient,
  savePortalRoles,
} from "@/lib/portalUserStore";

const clientId = "client-template-test";
const clientName = "Acme Corp";

describe("ClientUsersPage download template and auto-fill import", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("includes only editable Add User fields in the download template and excludes non-editable fields", () => {
    expect(USER_TEMPLATE_HEADERS).not.toContain("User ID");
    expect(USER_TEMPLATE_HEADERS).not.toContain("User Type");
    expect(USER_TEMPLATE_HEADERS).not.toContain("Organization Access");
    expect(USER_TEMPLATE_HEADERS).not.toContain("Permissions");

    expect(USER_TEMPLATE_HEADERS).toEqual([
      "Employee ID",
      "Full Name",
      "Email ID",
      "Phone Number",
      "Job Title",
      "Department",
      "Reporting Manager",
      "Gender",
      "Joining Date",
      "Status",
      "Role",
      "Data Visibility",
      "Location Access",
      "Currency",
      "Monthly Limit",
      "Annual Limit",
      "Require Approval",
      "Approval Threshold",
      "Allowed Expense Categories",
    ]);

    let capturedBlob: Blob | null = null;
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      capturedBlob = blob as Blob;
      return "blob:mock-template";
    });
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadUserTemplate();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-template");
    expect(capturedBlob).not.toBeNull();
  });

  it("auto-fills User ID, User Type, Organization Access, and inherited role Permissions on CSV import", async () => {
    savePortalRoles(clientId, [
      {
        id: "procurement-lead",
        name: "Procurement Lead",
        description: "Lead role",
        status: "active",
        permissions: [
          createPortalRolePermission("Dashboard", { view: true }),
          createPortalRolePermission("Orders", { view: true, create: true, approve: true }),
        ],
      },
    ]);

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <PermissionsProvider>
            <ClientUsersPage clientId={clientId} clientName={clientName} />
          </PermissionsProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const headerButtons = container.querySelectorAll("button");
    const menuBtn = Array.from(headerButtons).find((btn) =>
      btn.querySelector("svg.lucide-ellipsis-vertical"),
    );
    expect(menuBtn).toBeTruthy();
    fireEvent.click(menuBtn!);
    fireEvent.click(screen.getByText("Import Users"));

    const csvContent = [
      USER_TEMPLATE_HEADERS.join(","),
      [
        "EMP-402",
        "Asha Rao",
        "asha@acmecorp.com",
        "9876543210",
        "Procurement Manager",
        "Operations",
        "Vikram Mehta",
        "Female",
        "2026-04-01",
        "Active",
        "Procurement Lead",
        "Department Only",
        "Assigned Locations",
        "USD",
        "2500",
        "25000",
        "Yes",
        "500",
        "\"Travel, Meals\"",
      ].join(","),
    ].join("\r\n");

    const fileInput = container.querySelector('input[type="file"][accept=".csv"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const csvFile = new File([csvContent], "user_template.csv", { type: "text/csv" });
    class MockFileReader {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsText() {
        this.onload?.({ target: { result: csvContent } } as ProgressEvent<FileReader>);
      }
    }
    vi.stubGlobal("FileReader", MockFileReader);
    fireEvent.change(fileInput, { target: { files: [csvFile] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import 1 User/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /Import 1 User/i }));

    await waitFor(() => {
      const users = getPortalUsersByClient(clientId);
      const imported = users.find((u) => u.email === "asha@acmecorp.com");
      expect(imported).toBeDefined();
      expect(imported?.id).toBeTruthy();
      expect(imported?.userType).toBe("client_user");
      expect(imported?.clientName).toBe(clientName);
      expect(imported?.role).toBe("Procurement Lead");

      const details = imported?.details as Record<string, unknown>;
      expect(details.userType).toBe("Client User");
      expect(details.orgAccess).toBe(clientName);
      expect(details.employeeId).toBe("EMP-402");
      expect(details.department).toBe("Operations");
      expect(details.reportingManager).toBe("Vikram Mehta");
      expect(details.gender).toBe("Female");
      expect(details.joiningDate).toBe("2026-04-01");
      expect(details.dataVisibility).toBe("Department Only");
      expect(details.locationAccess).toBe("Assigned Locations");
      expect(details.expenseForm).toEqual({
        currency: "USD",
        monthlyLimit: "2500",
        annualLimit: "25000",
        approvalRequired: true,
        approvalThreshold: "500",
        categories: ["Travel", "Meals"],
      });
      expect(details.permissions).toEqual([
        createPortalRolePermission("Dashboard", { view: true }),
        createPortalRolePermission("Orders", { view: true, create: true, approve: true }),
      ]);
    });
  });
});

