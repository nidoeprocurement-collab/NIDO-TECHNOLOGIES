import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import { MyOrdersProvider } from "@/contexts/MyOrdersContext";
import { saveRoles, saveUsers } from "@/lib/nidoUsersStore";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "System Owner", email: "owner@nidotech.com", role: "System Owner" },
    isAuthenticated: true,
    isClientPortalUser: false,
    isImpersonating: false,
  }),
}));

describe("OrderDetailsPage - Assignment popup for physical and digital orders", () => {
  beforeEach(() => {
    localStorage.clear();
    saveRoles([
      {
        id: "role-system-owner",
        department: "All Departments",
        name: "System Owner",
        description: "Full access",
        status: "Active",
      },
      {
        id: "role-ops-lead",
        department: "Operations",
        name: "Operations Lead",
        description: "Operations management",
        status: "Active",
      },
      {
        id: "role-proc-exec",
        department: "Procurement",
        name: "Procurement Executive",
        description: "Procurement operations",
        status: "Active",
      },
    ]);
    saveUsers([
      {
        id: "user-ops-1",
        employeeId: "EMP-00002",
        name: "Sneha Iyer",
        email: "sneha@nidotech.com",
        password: "Password@123",
        phone: "9876543210",
        role: "Operations Lead",
        jobTitle: "Operations Lead",
        designation: "Operations Lead",
        reportingManager: "System Owner",
        department: "Operations",
        status: "Active",
        createdAt: "2026-11-10",
        updatedAt: "2026-11-10",
      },
      {
        id: "user-proc-1",
        employeeId: "EMP-00003",
        name: "Arjun Mehta",
        email: "arjun@nidotech.com",
        password: "Password@123",
        phone: "9876543211",
        role: "Procurement Executive",
        jobTitle: "Procurement Executive",
        designation: "Procurement Executive",
        reportingManager: "System Owner",
        department: "Procurement",
        status: "Active",
        createdAt: "2026-11-10",
        updatedAt: "2026-11-10",
      },
    ]);
  });

  it("auto-opens Edit Assignment popup on opening a newly placed physical order, lists NIDO users in Assigned To dropdown, and auto-fills Role", () => {
    const physicalOrder = {
      id: "ORD-000101",
      clientId: "CL-00001",
      client: "Infosys Limited",
      clientColor: "#2563eb",
      clientInitial: "I",
      poNumber: "PO-100101",
      requester: "Ramesh Kumar",
      requesterRole: "Buyer",
      requesterInitial: "R",
      requesterColor: "#2563eb",
      assigned: "Unassigned",
      assignedRole: "",
      assignedInitial: "U",
      assignedColor: "#276749",
      assignmentCompleted: false,
      orderDate: "Nov 10, 2026",
      orderTime: "10:15 AM",
      status: "Processing",
      slaTime: "24:00",
      slaAlert: false,
      totalAmount: "₹25,000.00",
      totalAmountNum: 25000,
      cartItems: [
        {
          id: 1,
          name: "Ergonomic Office Chair",
          image: "",
          priceNum: 25000,
          quantity: 1,
          category: "Furniture",
          specs: ["Mesh Back"],
          moq: 1,
          clientId: "CL-00001",
          productCode: "PRD-CHAIR-01",
          fulfillmentType: "physical",
        },
      ],
    };
    localStorage.setItem("nido_my_orders", JSON.stringify([physicalOrder]));

    render(
      <MemoryRouter initialEntries={["/orders/ORD-000101"]}>
        <MyOrdersProvider>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
          </Routes>
        </MyOrdersProvider>
      </MemoryRouter>,
    );

    // Edit Assignment popup opens automatically
    expect(screen.getByText("Edit Assignment")).toBeTruthy();

    const assignedToSelect = screen.getByLabelText("Assigned To") as HTMLSelectElement;
    const roleInput = screen.getByLabelText("Role") as HTMLInputElement;
    const assignedOnInput = screen.getByLabelText("Assigned On") as HTMLInputElement;

    // Verify all NIDO users are present in the Assigned To dropdown with their role shown beside their name
    const optionValues = Array.from(assignedToSelect.options).map(o => o.value);
    const optionLabels = Array.from(assignedToSelect.options).map(o => o.textContent);
    expect(optionValues).toContain("System Owner");
    expect(optionValues).toContain("Sneha Iyer");
    expect(optionValues).toContain("Arjun Mehta");
    expect(optionLabels).toContain("System Owner — System Owner");
    expect(optionLabels).toContain("Sneha Iyer — Operations Lead");
    expect(optionLabels).toContain("Arjun Mehta — Procurement Executive");

    // Select "Sneha Iyer" and verify her role auto-populates in the Role field
    fireEvent.change(assignedToSelect, { target: { value: "Sneha Iyer" } });
    expect(roleInput.value).toBe("Operations Lead");
    expect(assignedOnInput.value).toBe("Nov 10, 2026 10:15 AM");

    // Save assignment and verify persistence
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByText("Edit Assignment")).toBeNull();
    expect(screen.getByText("Sneha Iyer")).toBeTruthy();
    expect(screen.getByText("Operations Lead")).toBeTruthy();

    const storedOrders = JSON.parse(localStorage.getItem("nido_my_orders") || "[]");
    expect(storedOrders[0].assigned).toBe("Sneha Iyer");
    expect(storedOrders[0].assignedRole).toBe("Operations Lead");
    expect(storedOrders[0].assignmentCompleted).toBe(true);
  });

  it("auto-opens Edit Assignment popup on opening a newly placed digital order and auto-fills Role on user selection", () => {
    const digitalOrder = {
      id: "ORD-000102",
      clientId: "CL-00001",
      client: "Infosys Limited",
      clientColor: "#2563eb",
      clientInitial: "I",
      poNumber: "PO-100102",
      requester: "Ramesh Kumar",
      requesterRole: "Buyer",
      requesterInitial: "R",
      requesterColor: "#2563eb",
      assigned: "Unassigned",
      assignedRole: "",
      assignedInitial: "U",
      assignedColor: "#276749",
      assignmentCompleted: false,
      orderDate: "Nov 10, 2026",
      orderTime: "11:00 AM",
      status: "Processing",
      slaTime: "24:00",
      slaAlert: false,
      totalAmount: "₹12,000.00",
      totalAmountNum: 12000,
      cartItems: [
        {
          id: 2,
          name: "Microsoft 365 E3 License",
          image: "",
          priceNum: 12000,
          quantity: 1,
          category: "Software",
          specs: ["Annual Subscription"],
          moq: 1,
          clientId: "CL-00001",
          productCode: "PRD-M365-01",
          productType: "Digital License",
          fulfillmentType: "digital",
        },
      ],
    };
    localStorage.setItem("nido_my_orders", JSON.stringify([digitalOrder]));

    render(
      <MemoryRouter initialEntries={["/orders/ORD-000102"]}>
        <MyOrdersProvider>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
          </Routes>
        </MyOrdersProvider>
      </MemoryRouter>,
    );

    // Edit Assignment popup opens automatically for digital order too
    expect(screen.getByText("Edit Assignment")).toBeTruthy();

    const assignedToSelect = screen.getByLabelText("Assigned To") as HTMLSelectElement;
    const roleInput = screen.getByLabelText("Role") as HTMLInputElement;

    // Select "Arjun Mehta" and verify his role auto-populates
    fireEvent.change(assignedToSelect, { target: { value: "Arjun Mehta" } });
    expect(roleInput.value).toBe("Procurement Executive");
  });
});

