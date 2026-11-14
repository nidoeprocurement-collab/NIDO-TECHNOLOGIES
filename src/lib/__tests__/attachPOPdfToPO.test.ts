import { describe, it, expect, beforeEach } from "vitest";
import { attachPOPdfToPO } from "../generatePO";
import { getPOByNumber, savePO, type StoredPO } from "../purchaseOrderStore";

function createSamplePO(poNumber: string, itemOverrides: Partial<StoredPO["items"][number]> = {}): StoredPO {
  return {
    poNumber,
    orderId: "ORD-TEST-1",
    vendorId: "VND-1",
    vendorName: "Acme Supply",
    vendorCode: "ACME",
    vendorEmail: "vendor@acme.com",
    vendorPhone: "9876543210",
    vendorGstin: "29ABCDE1234F1Z5",
    vendorAddress: "123 Industrial Rd, Bengaluru",
    paymentTerms: "Net 30",
    status: "Confirmed",
    createdOn: new Date().toISOString(),
    createdOnDisplay: "13 Nov 2026",
    requestedDelivery: "20 Nov 2026",
    subtotal: 1000,
    sgstPct: 9,
    sgstAmt: 90,
    cgstPct: 9,
    cgstAmt: 90,
    grandTotal: 1180,
    items: [
      {
        subOrderId: "SUB-1",
        productCode: "PROD-1",
        item: "Test Item",
        hsnCode: "8471",
        qty: 1,
        unitPrice: 1000,
        gstPct: 18,
        lineSubtotal: 1000,
        status: "Processing",
        ...itemOverrides,
      },
    ],
    documents: [],
    notes: [],
  };
}

describe("attachPOPdfToPO", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates and attaches a PO PDF document for physical product POs", async () => {
    savePO(createSamplePO("PO-PHYS-101", { productType: "Physical" }));

    const docs = await attachPOPdfToPO("PO-PHYS-101");

    expect(docs).toHaveLength(1);
    expect(docs[0].name).toBe("PO-PHYS-101.pdf");
    expect(docs[0].type).toBe("Purchase Order");
    expect(docs[0].ext).toBe("pdf");
    expect(docs[0].dataUrl).toMatch(/^data:application\/pdf/);

    const stored = getPOByNumber("PO-PHYS-101");
    expect(stored?.documents).toHaveLength(1);
    expect(stored?.documents?.[0].dataUrl).toBe(docs[0].dataUrl);
  });

  it("generates and attaches a PO PDF document for digital product POs", async () => {
    savePO(
      createSamplePO("PO-DIG-202", {
        item: "Cloud License",
        productType: "Digital",
        licenseType: "Subscription",
        deliveryMethod: "Email",
      }),
    );

    const docs = await attachPOPdfToPO("PO-DIG-202");

    expect(docs).toHaveLength(1);
    expect(docs[0].name).toBe("PO-DIG-202.pdf");
    expect(docs[0].type).toBe("Purchase Order");
    expect(docs[0].dataUrl).toMatch(/^data:application\/pdf/);

    const stored = getPOByNumber("PO-DIG-202");
    expect(stored?.documents).toHaveLength(1);
    expect(stored?.documents?.[0].name).toBe("PO-DIG-202.pdf");
  });
});

