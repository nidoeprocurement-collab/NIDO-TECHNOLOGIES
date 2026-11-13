import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MyOrdersProvider, isOrderAssignmentCompleted } from "@/contexts/MyOrdersContext";
import { addUsers } from "@/lib/nidoUsersStore";
import { savePO } from "@/lib/purchaseOrderStore";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import VendorOrderDetailPage from "@/pages/VendorOrderDetailPage";

describe("Order & Vendor Order Assignment Gate", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "nido_auth_user",
      JSON.stringify({
        id: "admin-1",
        name: "System Owner",
        email: "owner@nidotech.com",
        role: "Admin",
        userType: "nido_admin",
      }),
    );
    addUsers([
      {
        id: "emp-1",
        employeeId: "EMP-1",
        name: "Anita Kapoor",
        email: "anita@nidotech.com",
        phone: "9876543210",
        role: "Procurement Manager",
        department: "Procurement",
        status: "Active",
        joinedDate: "2026-01-01",
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("isOrderAssignmentCompleted returns false until Assignment is saved", () => {
    expect(isOrderAssignmentCompleted(null)).toBe(false);
    expect(isOrderAssignmentCompleted({ assigned: "Unassigned", assignmentCompleted: false })).toBe(false);
    expect(isOrderAssignmentCompleted({ assigned: "Anita Kapoor", assignmentCompleted: false })).toBe(false);
    expect(isOrderAssignmentCompleted({ assigned: "Anita Kapoor", assignmentCompleted: true })).toBe(true);
    expect(isOrderAssignmentCompleted({ assigned: "Anita Kapoor" })).toBe(true);
  });

  it("locks OrderDetailsPage and VendorOrderDetailPage until Assignment is saved, then unlocks both", async () => {
    const orderId = "ORD-ASSIGN-101";
    const poNumber = "PO-ASSIGN-101";

    localStorage.setItem(
      "nido_my_orders",
      JSON.stringify([
        {
          id: orderId,
          client: "Acme Corp",
          clientId: "client-1",
          requester: "Ravi",
          requesterRole: "Buyer",
          requesterInitial: "R",
          requesterColor: "#2563eb",
          assigned: "Unassigned",
          assignedRole: "",
          assignedInitial: "U",
          assignedColor: "#2563eb",
          assignmentCompleted: false,
          orderDate: "2026-11-13",
          orderTime: "10:00 AM",
          status: "Pending",
          slaTime: null,
          slaAlert: false,
          totalAmount: "₹10,000",
          cartItems: [
            {
              id: "item-1",
              name: "Dell Latitude",
              qty: 1,
              price: 10000,
              vendorId: "v-1",
              vendorName: "TechHub",
              productCode: "DELL-1",
              productType: "Physical",
            },
          ],
        },
      ]),
    );

    savePO({
      poNumber,
      orderId,
      vendorId: "v-1",
      vendorName: "TechHub",
      vendorCity: "Bengaluru",
      vendorEmail: "vendor@techhub.com",
      status: "Draft",
      createdOn: "2026-11-13",
      totalAmount: "₹10,000",
      totalAmountNum: 10000,
      items: [
        {
          subOrderId: `${orderId}-1`,
          item: "Dell Latitude",
          productCode: "DELL-1",
          qty: 1,
          unitPrice: 10000,
          total: 10000,
          status: "Pending",
        },
      ],
      subOrderId: `${orderId}-1`,
      subOrderIds: [`${orderId}-1`],
    });

    // 1. VendorOrderDetailPage should be locked while order assignment is pending
    const vendorView = render(
      <MemoryRouter initialEntries={[`/vendor-orders/${poNumber}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/vendor-orders/:poNumber" element={<VendorOrderDetailPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Order Assignment Required");
    });
    expect(screen.queryByRole("button", { name: /Confirm Purchase Order/i })).toBeNull();
    vendorView.unmount();

    // 2. OrderDetailsPage should show the Assignment Required banner and lock Cancel Order
    const orderView = render(
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Order Assignment Required");
    });
    expect(screen.getByRole("button", { name: /Cancel Order/i })).toBeDisabled();

    // Save Assignment in the auto-opened Edit Assignment modal
    const assigneeSelect = screen.getByRole("combobox");
    fireEvent.change(assigneeSelect, { target: { value: "Anita Kapoor" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Assignment/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
    orderView.unmount();

    // 3. Re-opening VendorOrderDetailPage now unlocks Confirm Purchase Order
    render(
      <MemoryRouter initialEntries={[`/vendor-orders/${poNumber}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/vendor-orders/:poNumber" element={<VendorOrderDetailPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getAllByRole("button", { name: /Confirm Purchase Order/i }).length).toBeGreaterThan(0);
    });
  });
});
