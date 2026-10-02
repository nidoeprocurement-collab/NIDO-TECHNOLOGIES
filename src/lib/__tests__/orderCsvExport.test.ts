import { afterEach, describe, expect, it } from "vitest";
import { buildOrdersCsv } from "../orderCsvExport";
import type { MyOrder } from "@/contexts/MyOrdersContext";

const order: MyOrder = {
  id: "ORD-000001",
  createdBy: "Rajesh Kumar",
  createdAt: "2026-10-01T17:17:00.000Z",
  updatedBy: "Admin User",
  updatedAt: "2026-10-02T08:30:00.000Z",
  updateCount: 1,
  client: "Raj Manufacturing",
  clientId: "CI-00019",
  clientColor: "#2563eb",
  clientInitial: "R",
  poNumber: "PO-045183",
  requester: "Rajesh Kumar",
  requesterRole: "Client Admin",
  requesterInitial: "R",
  requesterColor: "#2563eb",
  assigned: "Admin User",
  assignedRole: "System Admin",
  assignedInitial: "A",
  assignedColor: "#16a34a",
  orderDate: "Oct 1, 2026",
  orderTime: "10:47 PM",
  status: "Processing",
  slaTime: "2 days",
  slaAlert: false,
  totalAmount: "₹5,900",
  totalAmountNum: 5900,
  paymentMethod: "Company BAN",
  paymentTerms: "Net 30",
  deliveryAddress: "123 Tech Street, Mumbai",
  orderNotes: "=SUM(A1:A3)",
  cartItems: [{
    id: 2049,
    name: "Samsung Galaxy",
    image: "",
    priceNum: 5900,
    quantity: 1,
    category: "Electronics",
    specs: ["128GB"],
    moq: 1,
    clientId: "CI-00019",
    productCode: "MPC-2026-000001",
    subOrderId: "SO-ORD-000001-001",
  }],
};

afterEach(() => localStorage.clear());

describe("buildOrdersCsv", () => {
  it("exports item rows, creator/update audit, approvals, notes, and safe document metadata", () => {
    localStorage.setItem("nido_notes_ORD-000001", JSON.stringify([
      {
        id: "status-change-1",
        author: "Admin User",
        date: "Oct 2, 2026 08:30 AM",
        text: "Order status changed from Draft to Processing.",
        visibility: "Internal Note",
        kind: "status-change",
      },
      {
        id: "activity_order_placed_ORD-000001",
        author: "Rajesh Kumar",
        date: "Oct 1, 2026 10:47 PM",
        text: "Order ORD-000001 was placed.",
        visibility: "Internal Note",
        kind: "activity",
      },
      {
        id: "note-1",
        author: "Rajesh Kumar",
        date: "Oct 2, 2026 08:31 AM",
        text: "Please call before delivery.",
        visibility: "External Note",
      },
    ]));
    localStorage.setItem("nido_docs_ORD-000001", JSON.stringify([{
      id: "doc-1",
      name: "purchase-request.pdf",
      ext: "pdf",
      size: "42 KB",
      type: "Purchase Request",
      uploadedBy: "Rajesh Kumar",
      uploadedOn: "Oct 1, 2026",
      description: "Signed request",
      dataUrl: "private-file-payload",
      passwordHash: "private-document-password-hash",
    }]));
    localStorage.setItem("nido_all_purchase_orders", JSON.stringify([{
      poNumber: "VPO-0001",
      orderId: order.id,
      subOrderId: "SO-ORD-000001-001",
      subOrderIds: ["SO-ORD-000001-001"],
      items: [{
        subOrderId: "SO-ORD-000001-001",
        item: "Samsung Galaxy",
        sku: "MPC-2026-000001",
        productCode: "MPC-2026-000001",
        category: "Electronics",
        hsnCode: "8517",
        specs: ["128GB"],
        referenceNumber: "REF-1",
        qty: 1,
        unitPrice: 5000,
        lineSubtotal: 5000,
        status: "Processing",
      }],
      vendorId: "VND-1001",
      vendorName: "InfoTech Pvt. Ltd.",
      vendorContact: "Vendor Contact",
      vendorEmail: "vendor@example.com",
      vendorPhone: "9000000000",
      vendorGstin: "GST-123",
      vendorAddress: "Mumbai",
      vendorAddressLine1: "",
      vendorAddressLine2: "",
      vendorCity: "Mumbai",
      vendorState: "Maharashtra",
      vendorPincode: "400001",
      item: "Samsung Galaxy",
      sku: "MPC-2026-000001",
      category: "Electronics",
      hsnCode: "8517",
      specs: ["128GB"],
      referenceNumber: "REF-1",
      qty: 1,
      unitPrice: 5000,
      subtotal: 5000,
      sgstPct: 9,
      cgstPct: 9,
      sgstAmt: 450,
      cgstAmt: 450,
      grandTotal: 5900,
      paymentTerms: "Net 30",
      status: "Confirmed",
      createdOn: "2026-10-01T17:20:00.000Z",
      createdOnDisplay: "01/10/2026",
      requestedDelivery: "Oct 10, 2026",
      documents: [{ id: "po-doc", name: "vendor-po.pdf", ext: "pdf", type: "PO", uploadedBy: "Admin", uploadedOn: "Oct 1, 2026", dataUrl: "po-private-payload" }],
      notes: [{ id: "po-note", author: "Admin", initials: "A", color: "#000", date: "Oct 1, 2026", text: "PO issued", visibility: "Internal Note", kind: "activity" }],
    }]));

    const csv = buildOrdersCsv([order], {
      approvalRequests: [{
        id: "approval-1",
        workflowId: "workflow-1",
        workflow: "Order approval",
        workflowVersion: 1,
        module: "Order",
        trigger: "Order placed",
        reference: order.id,
        requestedBy: "user-1",
        requestedByName: "Rajesh Kumar",
        currentApprover: "Admin User",
        currentLevel: 1,
        status: "Approved",
        context: {},
        createdAt: "2026-10-01T17:18:00.000Z",
        timeline: [{ action: "Approved", actor: "Admin User", date: "Oct 2, 2026 08:20 AM" }],
      }],
    });

    expect(csv).toContain("Master Order ID");
    expect(csv).toContain("Rajesh Kumar");
    expect(csv).toContain("Admin User");
    expect(csv).toContain("Update Count");
    expect(csv).toContain("Order status changed from Draft to Processing.");
    expect(csv).toContain("purchase-request.pdf");
    expect(csv).toContain("vendor-po.pdf");
    expect(csv).toContain("Please call before delivery.");
    expect(csv).toContain("Order approval");
    expect(csv).toContain("\"'=SUM(A1:A3)\"");
    expect(csv).not.toContain("private-file-payload");
    expect(csv).not.toContain("private-document-password-hash");
    expect(csv).not.toContain("po-private-payload");
  });

  it("omits internal notes and vendor procurement details for client-portal exports", () => {
    localStorage.setItem("nido_notes_ORD-000001", JSON.stringify([
      { id: "internal", author: "Staff", date: "Oct 2, 2026", text: "Internal review", visibility: "Internal Note" },
      { id: "external", author: "Client", date: "Oct 2, 2026", text: "External update", visibility: "External Note" },
    ]));
    const csv = buildOrdersCsv([order], { hideInternal: true });
    expect(csv).toContain("External update");
    expect(csv).not.toContain("Internal review");
    expect(csv).not.toContain("InfoTech Pvt. Ltd.");
  });
});