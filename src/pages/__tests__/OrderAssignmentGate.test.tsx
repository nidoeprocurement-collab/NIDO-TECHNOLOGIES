import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MyOrdersProvider, isOrderAssignmentCompleted } from "@/contexts/MyOrdersContext";
import { saveUsers } from "@/lib/nidoUsersStore";
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
    saveUsers([
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
      subtotal: 10000,
      sgstAmt: 0,
      cgstAmt: 0,
      grandTotal: 10000,
      sgstPct: 0,
      cgstPct: 0,
      items: [
        {
          subOrderId: `${orderId}-1`,
          item: "Dell Latitude",
          productCode: "DELL-1",
          qty: 1,
          unitPrice: 10000,
          lineSubtotal: 10000,
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
              <Route path="/vendor-orders/:id" element={<VendorOrderDetailPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Order Assignment Required");
    });
    expect(screen.queryByRole("button", { name: /Confirm Purchase Order/i })).toBeNull();
    vendorView.unmount();

    // 2. OrderDetailsPage should show the Assignment Required banner and lock Cancel Order
    const orderView = render(
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/orders/:id" element={<OrderDetailsPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Order Assignment Required");
    });
    expect((screen.getByRole("button", { name: /Cancel Order/i }) as HTMLButtonElement).disabled).toBe(true);

    // Save Assignment in the auto-opened Edit Assignment modal
    const assigneeSelect = screen.getByLabelText("Assigned To");
    fireEvent.change(assigneeSelect, { target: { value: "Anita Kapoor" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

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
              <Route path="/vendor-orders/:id" element={<VendorOrderDetailPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getAllByRole("button", { name: /Confirm Purchase Order/i }).length).toBeGreaterThan(0);
    });
  }, 15000);

  it("unlocks status updates per item when its PO is Confirmed even if another PO in the same order is Draft", async () => {
    const orderId = "ORD-MIXED-PO-201";
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
          assigned: "Anita Kapoor",
          assignedRole: "Procurement Manager",
          assignedInitial: "A",
          assignedColor: "#2563eb",
          assignmentCompleted: true,
          orderDate: "2026-11-13",
          orderTime: "10:00 AM",
          status: "Processing",
          slaTime: null,
          slaAlert: false,
          totalAmount: "₹20,000",
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
            {
              id: "item-2",
              name: "HP Monitor",
              qty: 1,
              price: 10000,
              vendorId: "v-2",
              vendorName: "DisplayCo",
              productCode: "HP-MON-1",
              productType: "Physical",
            },
          ],
        },
      ]),
    );

    savePO({
      poNumber: "PO-CONFIRMED-201",
      orderId,
      vendorId: "v-1",
      vendorName: "TechHub",
      vendorCity: "Bengaluru",
      vendorEmail: "vendor@techhub.com",
      status: "Confirmed",
      createdOn: "2026-11-13",
      totalAmount: "₹10,000",
      totalAmountNum: 10000,
      subtotal: 10000,
      sgstAmt: 0,
      cgstAmt: 0,
      grandTotal: 10000,
      sgstPct: 0,
      cgstPct: 0,
      items: [
        {
          subOrderId: `${orderId}-1`,
          item: "Dell Latitude",
          productCode: "DELL-1",
          qty: 1,
          unitPrice: 10000,
          lineSubtotal: 10000,
          status: "Processing",
        },
      ],
      subOrderId: `${orderId}-1`,
      subOrderIds: [`${orderId}-1`],
    });

    savePO({
      poNumber: "PO-DRAFT-202",
      orderId,
      vendorId: "v-2",
      vendorName: "DisplayCo",
      vendorCity: "Bengaluru",
      vendorEmail: "sales@displayco.com",
      status: "Draft",
      createdOn: "2026-11-13",
      totalAmount: "₹10,000",
      totalAmountNum: 10000,
      subtotal: 10000,
      sgstAmt: 0,
      cgstAmt: 0,
      grandTotal: 10000,
      sgstPct: 0,
      cgstPct: 0,
      items: [
        {
          subOrderId: `${orderId}-2`,
          item: "HP Monitor",
          productCode: "HP-MON-1",
          qty: 1,
          unitPrice: 10000,
          lineSubtotal: 10000,
          status: "Pending",
        },
      ],
      subOrderId: `${orderId}-2`,
      subOrderIds: [`${orderId}-2`],
    });

    render(
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/orders/:id" element={<OrderDetailsPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const actionButtons = await screen.findAllByRole("button", { name: "⋮" });
    expect(actionButtons).toHaveLength(2);

    // Item 1 (Confirmed PO) -> Update Status is enabled
    fireEvent.click(actionButtons[0]);
    const updateBtn1 = await screen.findByRole("button", { name: /Update Status/i });
    expect(updateBtn1.getAttribute("aria-disabled")).toBe("false");

    // Close menu 1 before opening menu 2
    fireEvent.mouseDown(document.body);

    // Item 2 (Draft PO) -> Update Status is locked
    fireEvent.click(actionButtons[1]);
    const updateBtn2 = await screen.findByRole("button", { name: /Update Status/i });
    expect(updateBtn2.getAttribute("aria-disabled")).toBe("true");
  }, 15000);

  it("changes both PO Detail and Order Detail statuses to Processing once any PO is confirmed", async () => {
    const orderId = "ORD-CONFIRM-PROC-301";
    const poNumber = "PO-CONFIRM-PROC-301";
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
          assigned: "Anita Kapoor",
          assignedRole: "Procurement Manager",
          assignedInitial: "A",
          assignedColor: "#2563eb",
          assignmentCompleted: true,
          orderDate: "2026-11-13",
          orderTime: "10:00 AM",
          status: "Pending",
          slaTime: null,
          slaAlert: false,
          totalAmount: "₹20,000",
          cartItems: [
            {
              id: "item-1",
              subOrderId: `SO-${orderId}-001`,
              name: "Dell Latitude",
              qty: 1,
              price: 10000,
              vendorId: "v-1",
              vendorName: "TechHub",
              productCode: "DELL-1",
              productType: "Physical",
            },
            {
              id: "item-2",
              subOrderId: `SO-${orderId}-002`,
              name: "HP Monitor",
              qty: 1,
              price: 10000,
              vendorId: "v-2",
              vendorName: "DisplayCo",
              productCode: "HP-MON-1",
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
      subtotal: 10000,
      sgstAmt: 0,
      cgstAmt: 0,
      grandTotal: 10000,
      sgstPct: 0,
      cgstPct: 0,
      items: [
        {
          subOrderId: `SO-${orderId}-001`,
          item: "Dell Latitude",
          productCode: "DELL-1",
          qty: 1,
          unitPrice: 10000,
          lineSubtotal: 10000,
          status: "Pending",
        },
      ],
      subOrderId: `SO-${orderId}-001`,
      subOrderIds: [`SO-${orderId}-001`],
    });

    const vendorView = render(
      <MemoryRouter initialEntries={[`/vendor-orders/${poNumber}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/vendor-orders/:id" element={<VendorOrderDetailPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    const confirmButtons = await screen.findAllByRole("button", { name: /Confirm Purchase Order/i });
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Processing").length).toBeGreaterThan(0);
    });
    vendorView.unmount();

    render(
      <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
        <AuthProvider>
          <MyOrdersProvider>
            <Routes>
              <Route path="/orders/:id" element={<OrderDetailsPage />} />
            </Routes>
          </MyOrdersProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const savedSubItems = JSON.parse(localStorage.getItem(`nido_subitems_${orderId}`) || "{}");
      expect(savedSubItems[`SO-${orderId}-001`]?.itemStatus).toBe("Processing");
      expect(screen.getAllByText("Processing").length).toBeGreaterThan(0);
    });
  }, 15000);
});

