import type { ReportColumnGroup, ReportEntityType } from "@/components/reports/report-center/ReportsCenterUI";
import { getClients } from "@/lib/clientStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getReportRecords, getReportFieldValue, type ReportRecord } from "@/lib/reportData";
import { getInvoices } from "@/lib/invoiceStore";
import { getOrders } from "@/lib/salesOrderStore";
import { getServiceRequests } from "@/lib/serviceRequestsStore";
import { getSupportTickets } from "@/lib/supportTicketStore";
import { getUsers } from "@/lib/nidoUsersStore";
import { getVendors } from "@/lib/vendorDataStore";
import { getAllPOs } from "@/lib/purchaseOrderStore";
import { getAllVendorProducts } from "@/lib/vendorStore";
import { getQuotes } from "@/lib/quoteStore";
import { getReceipts } from "@/lib/paymentReceiptStore";
import { getStockHistory } from "@/lib/stockHistoryStore";
import { getSLAAuditLog } from "@/lib/slaEngine";
import { getTaxAuditLog } from "@/lib/taxEngine";
import { getImpersonationAudit } from "@/lib/impersonationStore";
import { getCustomReports } from "@/lib/reportStore";
import { loadApprovalBootstrap } from "@/lib/approvalEngine";
import { formatCurrency, formatDate } from "@/lib/formatters";

export const REPORT_CENTER_MODULES: Record<ReportEntityType, string[]> = {
  client: [
    "Client Orders",
    "Catalog",
    "Services",
    "Invoices / Bills",
    "Payments",
    "Support",
    "Client Reports",
    "External Stakeholders",
  ],
  vendor: [
    "Products / Catalog",
    "Vendor Orders",
    "Purchase Orders",
    "RFQs",
    "Invoices / Bills",
    "Payments",
    "Vendor Credits",
    "SLA",
  ],
  internal: [
    "Users",
    "Departments",
    "Orders",
    "Approvals",
    "Finance",
    "Audit Trail",
    "Catalog",
    "Inventory",
    "Support",
    "SLA",
    "Tax",
    "Sales Reports",
    "Procurement Reports",
    "Vendor Performance",
    "Client Reports",
    "Internal Stakeholders",
    "External Stakeholders",
    "Executive Dashboard",
    "Custom Reports",
  ],
};

const group = (label: string, ...columns: string[]): ReportColumnGroup => ({ label, columns });

export const REPORT_CENTER_COLUMNS: Record<string, ReportColumnGroup[]> = {
  "Products / Catalog": [group("PRODUCTS", "Vendor Name", "Product Name", "SKU", "Product Code", "Category", "Brand", "Unit Price", "Stock", "Reserved Stock", "Incoming Stock", "MOQ", "Lead Time", "Status", "Created date")],
  "Vendor Orders": [group("VENDOR ORDERS", "Vendor Name", "Order ID", "Order Date", "Order Status", "Amount", "PO Reference")],
  "Purchase Orders": [group("PURCHASE ORDERS", "Vendor Name", "PO Number", "Created On", "Status", "Amount", "Delivery Date")],
  RFQs: [group("RFQS", "RFQ Number", "Vendor Name", "Created On", "Status", "Amount")],
  "Client Orders": [group("CLIENT ORDERS", "Client Name", "Order ID", "Order Date", "Order Status", "Amount")],
  Catalog: [group("CATALOG", "Item Name", "SKU", "Category", "Price", "Stock", "Status")],
  Services: [group("SERVICES", "Service Name", "Request Date", "Client Name", "Status", "Assigned To")],
  "Invoices / Bills": [group("INVOICES AND BILLS", "Document Type", "Invoice / Bill Number", "Client Name", "Vendor Name", "Date", "Due Date", "Status", "Amount")],
  Payments: [group("PAYMENTS", "Payment Type", "Payment Number", "Client Name", "Vendor Name", "Payment Date", "Status", "Amount", "Method")],
  "Vendor Credits": [group("VENDOR CREDITS", "Credit Number", "Vendor Name", "Credit Date", "Status", "Amount", "Associated Bill")],
  SLA: [group("SLA", "Vendor Name", "Client Name", "Event", "Status", "Created On", "Description")],
  Users: [group("USERS", "Name", "Email", "Department", "Role", "Status", "Created date")],
  Departments: [group("DEPARTMENTS", "Department", "User Count", "Status")],
  Orders: [group("ORDERS", "Client Name", "Order ID", "Order Date", "Order Status", "Amount")],
  Approvals: [group("APPROVALS", "Record Type", "Name", "Module", "Status", "Created On", "Requested By")],
  Finance: [group("FINANCE", "Document Type", "Document Number", "Client Name", "Vendor Name", "Date", "Status", "Amount")],
  "Audit Trail": [group("AUDIT", "Event", "User", "Module", "Action", "Timestamp", "Status")],
  Inventory: [group("INVENTORY", "Product Name", "SKU", "Vendor Name", "Action", "Quantity", "Timestamp", "Reference")],
  Support: [group("SUPPORT", "Ticket ID", "Subject", "Client Name", "Priority", "Status", "Assigned To", "Created On")],
  Tax: [group("TAX", "Event", "Category", "Tax Type", "Rate", "Created On", "User")],
  "Sales Reports": [group("SALES", "Document Type", "Client Name", "Document Number", "Date", "Status", "Amount")],
  "Procurement Reports": [group("PROCUREMENT", "Vendor Name", "Document Type", "Document Number", "Date", "Status", "Amount")],
  "Vendor Performance": [group("VENDOR PERFORMANCE", "Vendor Name", "Category", "Status", "Rating", "PO Count", "Spend")],
  "Client Reports": [group("CLIENT REPORTS", "Client Name", "Document Type", "Document Number", "Date", "Status", "Amount")],
  "Internal Stakeholders": [group("INTERNAL STAKEHOLDERS", "Name", "Email", "Department", "Role", "Status")],
  "External Stakeholders": [group("EXTERNAL STAKEHOLDERS", "Name", "Entity Type", "Email", "Status", "Created date")],
  "Executive Dashboard": [group("PLATFORM SUMMARY", "Module", "Record Type", "Name", "Status", "Date", "Amount")],
  "Custom Reports": [group("SAVED REPORTS", "Name", "Report Type", "Module", "Frequency", "Last Run Status", "Created date")],
};

const toRecords = <T extends object>(items: T[]): ReportRecord[] =>
  items.map((item) => ({ ...item }) as ReportRecord);

function readLocalArray(key: string): ReportRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is ReportRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      : [];
  } catch {
    return [];
  }
}

function readLocalObject(key: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function mapVendorProducts(): ReportRecord[] {
  const vendorsById = new Map(getVendors().map((vendor) => [String(vendor.id), vendor.name]));
  return Object.entries(getAllVendorProducts()).flatMap(([vendorId, products]) =>
    products.map((product) => ({
      ...(product as unknown as ReportRecord),
      vendorId,
      vendorName: vendorsById.get(vendorId) ?? "",
    })),
  );
}

function mapDepartments(): ReportRecord[] {
  const users = toRecords(getUsers());
  const counts = new Map<string, number>();
  for (const user of users) {
    const department = String(user.department ?? user.departmentName ?? "").trim();
    if (department) counts.set(department, (counts.get(department) ?? 0) + 1);
  }
  return [...counts.entries()].map(([department, userCount]) => ({
    id: department,
    department,
    userCount,
    status: "Active",
  }));
}

function getBills(): ReportRecord[] {
  return readLocalArray("nido_purchase_bills_v1").map((record) => ({ ...record, documentType: "Bill" }));
}

function getVendorCredits(): ReportRecord[] {
  return readLocalArray("nido_purchase_vendor_credits_v1");
}

function getPaymentsMade(): ReportRecord[] {
  return readLocalArray("nido_purchase_payments_made_v1").map((record) => ({ ...record, paymentType: "Vendor payment" }));
}

function getApprovalRecords(): ReportRecord[] {
  const store = readLocalObject("nido_local_approval_engine");
  const workflows = Array.isArray(store.workflows) ? store.workflows : [];
  const requests = Array.isArray(store.requests) ? store.requests : [];
  return [
    ...workflows.filter((record): record is ReportRecord => Boolean(record) && typeof record === "object").map((record) => ({ ...record, recordType: "Workflow" })),
    ...requests.filter((record): record is ReportRecord => Boolean(record) && typeof record === "object").map((record) => ({ ...record, recordType: "Request" })),
  ];
}

function getAuditRecords(): ReportRecord[] {
  return [
    ...toRecords(getStockHistory()).map((record) => ({ ...record, event: "Stock event" })),
    ...toRecords(getTaxAuditLog()).map((record) => ({ ...record, event: "Tax configuration event" })),
    ...toRecords(getSLAAuditLog()).map((record) => ({ ...record, event: "SLA event" })),
    ...toRecords(getImpersonationAudit()).map((record) => ({ ...record, event: "Impersonation event" })),
  ];
}

function getAllFinanceRecords(): ReportRecord[] {
  return [
    ...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })),
    ...getBills(),
    ...toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" })),
    ...getPaymentsMade(),
    ...getVendorCredits(),
  ];
}

export function getReportCenterRecords(module: string): ReportRecord[] {
  switch (module) {
    case "Products / Catalog":
      return mapVendorProducts();
    case "Vendor Orders":
    case "Purchase Orders":
    case "Procurement Reports":
      return toRecords(getAllPOs());
    case "RFQs":
      // This installation has no separate RFQ record store yet.
      return [];
    case "Client Orders":
    case "Orders":
      return toRecords(getOrders());
    case "Catalog":
    case "Inventory":
      return module === "Inventory" ? toRecords(getStockHistory()) : toRecords(getCatalogProducts());
    case "Services":
      return toRecords(getServiceRequests());
    case "Support":
      return toRecords(getSupportTickets());
    case "Invoices / Bills":
      return [...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })), ...getBills()];
    case "Payments":
      return [...toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" })), ...getPaymentsMade()];
    case "Vendor Credits":
      return getVendorCredits();
    case "SLA":
      return toRecords(getSLAAuditLog());
    case "Users":
    case "Internal Stakeholders":
      return toRecords(getUsers());
    case "Departments":
      return mapDepartments();
    case "Approvals":
      return getApprovalRecords();
    case "Finance":
      return getAllFinanceRecords();
    case "Audit Trail":
      return getAuditRecords();
    case "Tax":
      return toRecords(getTaxAuditLog());
    case "Sales Reports":
      return [
        ...toRecords(getOrders()).map((record) => ({ ...record, documentType: "Sales order" })),
        ...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })),
        ...toRecords(getQuotes()).map((record) => ({ ...record, documentType: "Quote" })),
      ];
    case "Vendor Performance":
      return [...toRecords(getVendors()), ...toRecords(getAllPOs())];
    case "Client Reports":
      return [...toRecords(getClients()), ...toRecords(getOrders()), ...toRecords(getServiceRequests())];
    case "External Stakeholders":
      return [
        ...toRecords(getClients()).map((record) => ({ ...record, entityType: "Client" })),
        ...toRecords(getVendors()).map((record) => ({ ...record, entityType: "Vendor" })),
      ];
    case "Executive Dashboard":
      return getReportRecords("All Modules");
    case "Custom Reports":
      return toRecords(getCustomReports());
    default:
      return [];
  }
}

export async function loadReportCenterRecords(module: string): Promise<ReportRecord[]> {
  if (module !== "Approvals") return getReportCenterRecords(module);
  try {
    const bootstrap = await loadApprovalBootstrap();
    return [
      ...bootstrap.workflows.map((record) => ({ ...record, recordType: "Workflow" })),
      ...bootstrap.requests.map((record) => ({ ...record, recordType: "Request" })),
    ] as unknown as ReportRecord[];
  } catch {
    return getApprovalRecords();
  }
}

export function getReportCenterEntities(): Record<ReportEntityType, { id: string; name: string }[]> {
  return {
    client: getClients().map((client) => ({ id: String(client.id), name: String(client.name ?? client.id) })),
    vendor: getVendors().map((vendor) => ({ id: String(vendor.id), name: String(vendor.name ?? vendor.id) })),
    internal: mapDepartments().map((department) => ({ id: String(department.id), name: String(department.department) })),
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const VALUE_ALIASES: Record<string, string[]> = {
  "Vendor Name": ["vendorName", "supplierName"],
  "Product Name": ["productName", "itemName", "item", "name"],
  "Item Name": ["productName", "itemName", "item", "name"],
  SKU: ["sku", "masterProductCode", "itemCode"],
  "Product Code": ["productCode", "masterProductCode"],
  "Unit Price": ["unitPrice", "unitCost", "price", "rate"],
  Price: ["price", "unitPrice", "sellingPrice"],
  Stock: ["stock", "currentStock", "physicalStock", "quantity", "qty", "onHand"],
  "Reserved Stock": ["reservedStock", "reserved"],
  "Incoming Stock": ["incomingStock", "incoming"],
  MOQ: ["moq", "minimumOrderQuantity"],
  "Lead Time": ["leadTime", "leadTimeDays"],
  "Client Name": ["clientName", "customerName", "client", "customer"],
  "Order ID": ["orderNumber", "orderId", "id"],
  "Order Date": ["orderDate", "date", "createdAt"],
  "Order Status": ["status"],
  "PO Reference": ["poNumber", "purchaseOrderNumber"],
  "PO Number": ["poNumber", "purchaseOrderNumber"],
  "Invoice / Bill Number": ["invoiceNumber", "billNumber", "number"],
  "Document Number": ["invoiceNumber", "billNumber", "orderNumber", "poNumber", "number"],
  "Payment Number": ["paymentNumber", "receiptNumber", "reference", "id"],
  "Payment Date": ["paymentDate", "receiptDate", "date", "createdAt"],
  "Credit Number": ["creditNoteNumber", "creditNumber", "number"],
  "Associated Bill": ["associatedBillNumber", "billNumber"],
  "Request Date": ["requestDate", "createdAt", "date"],
  "Service Name": ["serviceName", "requestType", "name"],
  "Ticket ID": ["ticketId", "number", "id"],
  "Assigned To": ["assignedTo", "agent", "owner"],
  "Created On": ["createdAt", "createdOn", "createdDate", "date", "timestamp"],
  "Created date": ["createdAt", "createdOn", "createdDate", "date", "timestamp"],
  "Due Date": ["dueDate", "paymentDueDate"],
  "Delivery Date": ["deliveryDate", "expectedDeliveryDate"],
  "Department": ["department", "departmentName"],
  "User Count": ["userCount"],
  "Record Type": ["recordType", "type"],
  "Document Type": ["documentType", "recordType", "type"],
  "Entity Type": ["entityType"],
  "Payment Type": ["paymentType", "type"],
  "Payment Method": ["paymentMethod", "method"],
  Amount: ["grandTotal", "totalAmount", "amount", "total", "subtotal", "creditAmount"],
  Spend: ["grandTotal", "totalAmount", "amount", "total", "spend"],
  Rating: ["rating", "score"],
  "PO Count": ["poCount", "orderCount"],
  Timestamp: ["timestamp", "createdAt", "date"],
};

function findValue(record: ReportRecord, column: string): unknown {
  const aliases = VALUE_ALIASES[column] ?? [column];
  for (const alias of aliases) {
    const key = Object.keys(record).find((candidate) => normalize(candidate) === normalize(alias));
    if (key && record[key] !== null && record[key] !== undefined && record[key] !== "") return record[key];
  }
  const fallback = getReportFieldValue(record, column);
  return fallback === "—" ? undefined : fallback;
}

export function getReportCenterCellValue(record: ReportRecord, column: string): string {
  const value = findValue(record, column);
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (/(amount|price|total|spend|cost)$/i.test(column)) {
    const amount = Number(value);
    if (Number.isFinite(amount)) return formatCurrency(amount);
  }
  if (/(date|timestamp|created on)$/i.test(column)) {
    const timestamp = value instanceof Date ? value.toISOString() : String(value);
    if (!Number.isNaN(new Date(timestamp).getTime())) return formatDate(timestamp);
  }
  return String(value);
}

export function filterReportCenterRecords(
  records: ReportRecord[],
  draft: {
    entityType: ReportEntityType;
    entityIds: string[];
    allEntities: boolean;
    dateBasis: string;
    dateFrom: string;
    dateTo: string;
  },
  entities: Record<ReportEntityType, { id: string; name: string }[]>,
): ReportRecord[] {
  let filtered = records;
  if (!draft.allEntities) {
    if (!draft.entityIds.length) return [];
    const names = new Set(
      (entities[draft.entityType] ?? [])
        .filter((entity) => draft.entityIds.includes(entity.id))
        .map((entity) => normalize(entity.name)),
    );
    const ids = new Set(draft.entityIds.map(normalize));
    filtered = filtered.filter((record) => {
      const candidates = draft.entityType === "vendor"
        ? [record.vendorId, record.vendorName, record.supplierId, record.supplierName]
        : draft.entityType === "client"
          ? [record.clientId, record.clientName, record.customerId, record.customerName, record.client]
          : [record.departmentId, record.department, record.departmentName];
      return candidates.some((candidate) => {
        if (candidate === null || candidate === undefined) return false;
        const value = normalize(String(candidate));
        return ids.has(value) || names.has(value);
      });
    });
  }

  if (!draft.dateFrom && !draft.dateTo) return filtered;
  const dateKeys: Record<string, string[]> = {
    "Created date": ["createdAt", "createdOn", "createdDate", "date", "timestamp"],
    "Updated date": ["updatedAt", "modifiedAt", "lastUpdatedAt"],
    "Order date": ["orderDate", "invoiceDate", "billDate", "date", "createdAt"],
    "Delivery date": ["deliveryDate", "expectedDeliveryDate", "dueDate"],
  };
  const keys = dateKeys[draft.dateBasis] ?? dateKeys["Created date"];
  return filtered.filter((record) => {
    const key = Object.keys(record).find((candidate) => keys.some((alias) => normalize(alias) === normalize(candidate)));
    const raw = key ? record[key] : undefined;
    if (!raw) return false;
    const value = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(String(raw));
      if (Number.isNaN(parsed.getTime())) return false;
      const localValue = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
      return (!draft.dateFrom || localValue >= draft.dateFrom) && (!draft.dateTo || localValue <= draft.dateTo);
    }
    return (!draft.dateFrom || value >= draft.dateFrom) && (!draft.dateTo || value <= draft.dateTo);
  });
}

export function getReportCenterPreview(
  records: ReportRecord[],
  columns: string[],
): { id: string; values: Record<string, string> }[] {
  return records.slice(0, 100).map((record, index) => ({
    id: String(record.id ?? record.number ?? record.poNumber ?? record.orderNumber ?? index),
    values: Object.fromEntries(columns.map((column) => [column, getReportCenterCellValue(record, column)])),
  }));
}

export function getReportCenterExportData(
  records: ReportRecord[],
  columns: string[],
): { key: string; label: string }[] {
  return columns.map((column) => ({ key: column, label: column }));
}

export function getReportCenterRows(
  records: ReportRecord[],
  columns: string[],
): Record<string, string>[] {
  return records.map((record) => Object.fromEntries(columns.map((column) => [column, getReportCenterCellValue(record, column)])));
}

