import type { ReportColumnGroup, ReportEntityType } from "@/components/reports/report-center/ReportsCenterUI";
import { getClients } from "@/lib/clientStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getClientCatalog } from "@/lib/clientCatalogStore";
import {
  getClientActivities,
  getClientContract,
  getClientDocuments,
  getClientOrders,
  getClientServices,
} from "@/lib/clientDataStore";
import { getReportRecords, getReportFieldValue, type ReportRecord } from "@/lib/reportData";
import { getInvoices } from "@/lib/invoiceStore";
import { getOrders } from "@/lib/salesOrderStore";
import { getServiceRequests } from "@/lib/serviceRequestsStore";
import { getSupportTickets } from "@/lib/supportTicketStore";
import { getRoles, getUsers } from "@/lib/nidoUsersStore";
import { getVendors } from "@/lib/vendorDataStore";
import { getAllPOs } from "@/lib/purchaseOrderStore";
import { getAllVendorProducts } from "@/lib/vendorStore";
import { getQuotes } from "@/lib/quoteStore";
import { getReceipts } from "@/lib/paymentReceiptStore";
import { getAllThresholds, getStockHistory } from "@/lib/stockHistoryStore";
import {
  getApprovalSLA,
  getBusinessCalendar,
  getClientSLA,
  getEscalationRules,
  getProcurementSLA,
  getServiceSLA,
  getSLAAuditLog,
  getVendorSLA,
} from "@/lib/slaEngine";
import { getTaxAuditLog } from "@/lib/taxEngine";
import { getImpersonationAudit } from "@/lib/impersonationStore";
import { getBuiltinReportViews, getCustomReports } from "@/lib/reportStore";
import { loadApprovalBootstrap } from "@/lib/approvalEngine";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getPortalRoles, getPortalUsers } from "@/lib/portalUserStore";
import { getAllRolePermissions } from "@/lib/permissionsStore";
import { getUserDocuments } from "@/lib/nidoUserDocumentsStore";
import { getUserNotes } from "@/lib/nidoUserNotesStore";
import { getAutoAssignmentSettings } from "@/lib/autoAssignmentStore";
import { getAllClientPricing, getAllProductPricing, getClientPriceSlabs } from "@/lib/priceEngineStore";
import { getAllRecurring } from "@/lib/recurringInvoiceStore";
import { getOrderStatusConfig } from "@/lib/orderStatusStore";
import { getConfig } from "@/lib/configService";
import { getReportCenterHistory, getReportCenterSchedules } from "@/lib/reportCenterStore";
import { REPORT_WORKBOOK_COLUMNS, REPORT_WORKBOOK_MODULE_ORDER } from "@/lib/reportWorkbookColumns.generated";

const LIVE_MODULES_BY_TYPE: Record<ReportEntityType, Set<string>> = {
  client: new Set([
    "Client Orders", "Client Order Items", "Client Master and Onboarding", "Client Contracts",
    "Client Users and External Stakeholders", "Client Roles and Permissions", "Client Addresses",
    "Client Activity", "Client Documents", "Client Catalog", "Sales Quotes", "Sales Quote Items",
    "Sales Orders", "Sales Order Items", "Invoices and Proforma Invoices", "Invoice Items",
    "Invoice Payments and Activity", "Recurring Invoices", "Payment Receipts", "Receipt Allocations",
    "Credit Notes", "Credit Note Items", "Renewals", "Services Request Register", "AMC Requests",
    "Repair Requests", "Rental Requests", "Recycle and Disposal Requests", "Regular Purchase Requests",
    "Support Parent Tickets", "Support Child Tickets", "Ticket Conversations and Attachments",
  ]),
  vendor: new Set([
    "Vendor Orders", "Vendor Order Items", "Vendor PO Notes", "Vendor PO Documents", "Purchase Orders",
    "Purchase Order Items", "Bills", "Bill Items", "Payments Made", "Payment Made Allocations",
    "Vendor Credits", "Vendor Credit Items", "Vendor Master and Onboarding", "Vendor Categories",
    "Vendor Services", "Vendor Payments Overview", "Vendor Catalog", "Vendor SLA Policies",
    "Procurement SLA Stages", "Vendor Performance", "Procurement Three Way Match",
  ]),
  internal: new Set([
    "Nido Users", "Nido Roles", "Role Permissions", "Departments and Hierarchy", "User Invitations",
    "User Login History", "User Notes", "User Documents", "Automatic Assignment Rules", "Master Catalog",
    "Product Specifications", "Product Variants", "Vendor Catalog", "Client Catalog", "Product Commercial Terms",
    "Price Engine and Vendor Comparison", "Client Pricing and Margins", "Pricing Slabs and Rules",
    "Vendor Pricing Charges", "Inventory Balances", "Stock Movements", "Goods Receipts",
    "Returns and Cancellations", "Renewals", "Services Request Register", "AMC Requests", "Repair Requests",
    "Rental Requests", "Recycle and Disposal Requests", "Regular Purchase Requests", "AMC Visit Schedule",
    "Regular Purchase Items", "Service Appointments and Assignments", "Support Parent Tickets",
    "Support Child Tickets", "Ticket Conversations and Attachments", "Approval Workflows",
    "Approval Workflow Conditions", "Approval Workflow Levels", "Approval Requests",
    "Approval Decisions and History", "Vendor SLA Policies", "Client SLA Tiers", "Procurement SLA Stages",
    "Service SLA Policies", "Approval SLA Policies", "SLA Escalation Rules", "SLA Business Calendar",
    "SLA Audit History", "SLA Outcomes and Breaches", "Client and Vendor Spend", "Sales Revenue and Profit",
    "AR and AP Ageing", "Vendor Performance", "Dashboard and Client Activity Summary",
    "Organization and General Settings", "Order Status Configuration", "Tax Audit",
    "Tax Transaction Reconciliation", "Audit and Impersonation", "Report Definitions", "Scheduled Reports",
    "Report Download and Email History", "Product Categories Brands and Tags", "Expenses",
    "Transactions Ledger", "Procurement Three Way Match",
  ]),
};

export const REPORT_CENTER_MODULES: Record<ReportEntityType, string[]> = {
  client: REPORT_WORKBOOK_MODULE_ORDER.filter((module) => LIVE_MODULES_BY_TYPE.client.has(module)),
  vendor: REPORT_WORKBOOK_MODULE_ORDER.filter((module) => LIVE_MODULES_BY_TYPE.vendor.has(module)),
  internal: REPORT_WORKBOOK_MODULE_ORDER.filter((module) => LIVE_MODULES_BY_TYPE.internal.has(module)),
};

const group = (label: string, ...columns: string[]): ReportColumnGroup => ({ label, columns });

const LEGACY_REPORT_CENTER_COLUMNS: Record<string, ReportColumnGroup[]> = {
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
  "Custom Reports": [group("SAVED REPORTS", "Name", "Report Type", "Module", "Frequency", "Last Run Status", "Created date")],
};

export const REPORT_CENTER_COLUMNS: Record<string, ReportColumnGroup[]> = {
  ...LEGACY_REPORT_CENTER_COLUMNS,
  ...Object.fromEntries(
    [...new Set(Object.values(REPORT_CENTER_MODULES).flat())].map((module) => [
      module,
      [group("WORKBOOK COLUMN ORDER", ...(REPORT_WORKBOOK_COLUMNS[module] ?? []))],
    ]),
  ),
};

export function orderReportCenterColumns(module: string, selectedColumns: string[]): string[] {
  const selected = new Set(selectedColumns);
  const canonical = REPORT_CENTER_COLUMNS[module]?.flatMap((columnGroup) => columnGroup.columns) ?? [];
  const ordered = canonical.filter((column) => selected.has(column));
  const canonicalSet = new Set(canonical);
  return [...ordered, ...selectedColumns.filter((column) => !canonicalSet.has(column))];
}

export function getReportCenterDefaultColumns(module: string, count = 6): string[] {
  return (REPORT_CENTER_COLUMNS[module]?.flatMap((columnGroup) => columnGroup.columns) ?? []).slice(0, count);
}

export function withReportRunMetadata(
  records: ReportRecord[],
  draft: Pick<{
    dateFrom: string;
    dateTo: string;
    dateBasis: string;
  }, "dateFrom" | "dateTo" | "dateBasis">,
  generatedAt = new Date(),
): ReportRecord[] {
  const timezone = getConfig().localization.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const metadata: ReportRecord = {
    reportDateFrom: draft.dateFrom,
    reportDateTo: draft.dateTo,
    reportDateBasis: draft.dateBasis,
    reportGeneratedAt: generatedAt.toISOString(),
    reportTimezone: timezone,
  };
  return records.map((record) => ({ ...record, ...metadata }));
}

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

function mapClientCatalogRecords(): ReportRecord[] {
  return getClients().flatMap((client) => {
    const clientId = String(client.id);
    const clientName = String(client.name ?? clientId);
    return getClientCatalog(clientId).map((product, index) => ({
      ...(product as unknown as ReportRecord),
      id: `${clientId}:${product.productCode || product.sku || index}`,
      clientId,
      clientName,
      productName: product.name,
      price: product.priceNum ?? product.price,
      stock: product.availability,
      status: product.availability,
    }));
  });
}

function mapClientOrderRecords(): ReportRecord[] {
  const clients = getClients();
  const clientsById = new Map(clients.map((client) => [String(client.id), String(client.name ?? client.id)]));
  return clients.flatMap((client) => {
    const clientId = String(client.id);
    const clientName = clientsById.get(clientId) ?? clientId;
    return getClientOrders(clientId, clientName).map((order) => ({
      ...(order as unknown as ReportRecord),
      clientId,
      clientName: order.client && order.client !== clientId ? order.client : clientName,
      orderDate: order.date,
      amount: order.amountNum,
      totalAmount: order.amountNum,
    }));
  });
}

function mapClientServiceRecords(): ReportRecord[] {
  const clients = getClients();
  return clients.flatMap((client) => {
    const clientId = String(client.id);
    const clientName = String(client.name ?? clientId);
    return getClientServices(clientId).map((service) => ({
      ...(service as unknown as ReportRecord),
      clientId,
      clientName,
      serviceName: service.name,
      requestDate: service.startDate,
      assignedTo: service.provider,
    }));
  });
}

function getVendorStakeholderType(vendor: ReportRecord): "Vendor" | "Partner" | "Third Party" {
  const declared = String(
    vendor.stakeholderType ?? vendor.relationshipType ?? vendor.partnerType ?? "",
  ).toLowerCase();
  const category = String(vendor.category ?? "").toLowerCase();
  if (declared.includes("partner") || category.includes("partner")) return "Partner";
  if (declared.includes("third") || category.includes("third")) return "Third Party";
  return "Vendor";
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

function approvalRecordsForModule(
  module: string,
  workflows: ReportRecord[],
  requests: ReportRecord[],
): ReportRecord[] {
  switch (module) {
    case "Approval Workflows":
      return workflows;
    case "Approval Workflow Conditions":
      return childRecords(workflows, ["conditions", "workflowConditions"]);
    case "Approval Workflow Levels":
      return childRecords(workflows, ["levels", "approvalLevels"]);
    case "Approval Requests":
      return requests;
    case "Approval Decisions and History":
      return childRecords(requests, ["decisions", "history", "steps"]);
    default:
      return [...workflows, ...requests];
  }
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

function recordsFrom(value: unknown): ReportRecord[] {
  if (Array.isArray(value)) {
    return value.filter((record): record is ReportRecord =>
      Boolean(record) && typeof record === "object" && !Array.isArray(record),
    );
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? [value as ReportRecord]
    : [];
}

function childRecords(records: ReportRecord[], childKeys: string[]): ReportRecord[] {
  return records.flatMap((record) => {
    const childKey = childKeys.find((key) => Array.isArray(record[key]));
    if (!childKey) return [];
    const parentId = String(record.id ?? record.number ?? record.poNumber ?? record.invoiceNumber ?? "");
    return (record[childKey] as unknown[]).flatMap((child, index) => {
      if (!child || typeof child !== "object" || Array.isArray(child)) return [];
      return [{
        ...record,
        ...(child as ReportRecord),
        id: String((child as ReportRecord).id ?? `${parentId}:${childKey}:${index + 1}`),
        parentRecordId: parentId,
        parentRecordType: childKey,
      }];
    });
  });
}

function mapClientMasterRecords(): ReportRecord[] {
  return toRecords(getClients()).map((client) => ({
    ...client,
    clientId: client.clientId ?? client.id,
    clientName: client.clientName ?? client.name,
  }));
}

function mapClientContracts(): ReportRecord[] {
  return getClients().flatMap((client) => {
    const contract = getClientContract(String(client.id));
    return contract ? [{
      ...(contract as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    }] : [];
  });
}

function mapClientActivityRecords(): ReportRecord[] {
  return getClients().flatMap((client) =>
    getClientActivities(String(client.id)).map((activity) => ({
      ...(activity as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    })),
  );
}

function mapClientDocumentRecords(): ReportRecord[] {
  return getClients().flatMap((client) =>
    getClientDocuments(String(client.id)).map((document) => ({
      ...(document as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    })),
  );
}

function mapPortalUserRecords(): ReportRecord[] {
  const clientNames = new Map(getClients().map((client) => [String(client.id), String(client.name ?? client.id)]));
  return getPortalUsers().map((user) => ({
    ...(user as unknown as ReportRecord),
    clientName: clientNames.get(String(user.clientId)) ?? "",
  }));
}

function mapPortalRoleRecords(): ReportRecord[] {
  return getClients().flatMap((client) =>
    getPortalRoles(String(client.id)).map((role) => ({
      ...(role as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    })),
  );
}

function mapUserNotesAndDocuments(kind: "notes" | "documents"): ReportRecord[] {
  return getUsers().flatMap((user) => {
    const details = kind === "notes" ? getUserNotes(String(user.id)) : getUserDocuments(String(user.id));
    return details.map((detail) => ({
      ...(detail as unknown as ReportRecord),
      userId: user.id,
      userName: user.name,
      department: user.department,
    }));
  });
}

function mapRolePermissions(): ReportRecord[] {
  return Object.entries(getAllRolePermissions()).flatMap(([roleName, modules]) =>
    Object.entries(modules).map(([module, actions]) => ({
      ...(actions as ReportRecord),
      roleName,
      module,
    })),
  );
}

function mapClientRolePermissions(): ReportRecord[] {
  return mapPortalRoleRecords().flatMap((role) => {
    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    return permissions.filter((permission): permission is ReportRecord =>
      Boolean(permission) && typeof permission === "object" && !Array.isArray(permission),
    ).map((permission) => ({ ...role, ...permission }));
  });
}

function mapServiceRequests(module?: string): ReportRecord[] {
  const requests = toRecords(getServiceRequests());
  if (!module) return requests;
  const query = module.toLowerCase();
  const terms: Record<string, string[]> = {
    "AMC Requests": ["amc"],
    "Repair Requests": ["repair"],
    "Rental Requests": ["rental"],
    "Recycle and Disposal Requests": ["recycle", "disposal"],
    "Regular Purchase Requests": ["regular purchase", "purchase request"],
  };
  const matches = terms[module] ?? [];
  return requests.filter((request) => {
    const searchable = [request.type, request.requestType, request.category, request.serviceType, request.title]
      .map((value) => String(value ?? "").toLowerCase()).join(" ");
    return matches.some((term) => searchable.includes(term)) || searchable.includes(query);
  });
}

function mapPurchaseOrders(): ReportRecord[] {
  return toRecords(getAllPOs());
}

function mapInvoiceRecords(): ReportRecord[] {
  return toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" }));
}

function mapPaymentMadeRecords(): ReportRecord[] {
  return getPaymentsMade();
}

function mapCreditNotes(): ReportRecord[] {
  return readLocalArray("nido_credit_notes_v3");
}

function mapRenewals(): ReportRecord[] {
  return [
    ...readLocalArray("nidoRenewals").map((record) => ({ ...record, renewalSource: "Active" })),
    ...readLocalArray("nidoRenewalHistory").map((record) => ({ ...record, renewalSource: "History" })),
  ];
}

function mapExpenses(): ReportRecord[] {
  return readLocalArray("nido_expenses_v1");
}

function mapSlaRecords(module: string): ReportRecord[] {
  switch (module) {
    case "Vendor SLA Policies": return recordsFrom(getVendorSLA());
    case "Client SLA Tiers": return toRecords(getClientSLA());
    case "Procurement SLA Stages": return toRecords(getProcurementSLA());
    case "Service SLA Policies": return toRecords(getServiceSLA());
    case "Approval SLA Policies": return toRecords(getApprovalSLA());
    case "SLA Escalation Rules": return toRecords(getEscalationRules());
    case "SLA Business Calendar": return recordsFrom(getBusinessCalendar());
    case "SLA Audit History":
    case "SLA Outcomes and Breaches":
      return toRecords(getSLAAuditLog());
    default:
      return [];
  }
}

function mapTaxReconciliationRecords(): ReportRecord[] {
  return [
    ...mapInvoiceRecords().map((record) => ({ ...record, transactionType: "Sales invoice" })),
    ...getBills().map((record) => ({ ...record, transactionType: "Vendor bill" })),
    ...toRecords(getReceipts()).map((record) => ({ ...record, transactionType: "Payment receipt" })),
    ...getPaymentsMade().map((record) => ({ ...record, transactionType: "Vendor payment" })),
  ];
}

function mapClientDashboardRecords(): ReportRecord[] {
  const clients = mapClientMasterRecords();
  const orders = mapClientOrderRecords();
  const services = mapClientServiceRecords();
  const tickets = toRecords(getSupportTickets());
  return clients.map((client) => {
    const clientId = String(client.clientId ?? client.id);
    const clientName = String(client.clientName ?? client.name ?? clientId);
    const belongsToClient = (record: ReportRecord) =>
      String(record.clientId ?? record.customerId ?? record.clientName ?? record.customerName ?? "") === clientId ||
      String(record.clientName ?? record.customerName ?? "") === clientName;
    return {
      ...client,
      clientId,
      clientName,
      orderCount: orders.filter(belongsToClient).length,
      serviceRequestCount: services.filter(belongsToClient).length,
      supportTicketCount: tickets.filter(belongsToClient).length,
    };
  });
}

function getReportRunRecords(module: string, entityType?: ReportEntityType): ReportRecord[] | undefined {
  switch (module) {
    case "Client Master and Onboarding":
    case "Client Addresses":
      return mapClientMasterRecords();
    case "Client Contracts":
      return mapClientContracts();
    case "Client Users and External Stakeholders":
      return mapPortalUserRecords();
    case "Client Roles and Permissions":
      return mapClientRolePermissions();
    case "Client Activity":
      return mapClientActivityRecords();
    case "Client Documents":
      return mapClientDocumentRecords();
    case "Client Order Items":
      return childRecords(mapClientOrderRecords(), ["productDetails", "items", "cartItems"]);
    case "Sales Quotes":
      return toRecords(getQuotes());
    case "Sales Quote Items":
      return childRecords(toRecords(getQuotes()), ["lineItems", "items", "products"]);
    case "Sales Orders":
      return toRecords(getOrders());
    case "Sales Order Items":
      return childRecords(toRecords(getOrders()), ["lineItems", "items", "cartItems"]);
    case "Invoices and Proforma Invoices":
      return mapInvoiceRecords();
    case "Invoice Items":
      return childRecords(mapInvoiceRecords(), ["lineItems", "items"]);
    case "Invoice Payments and Activity":
      return childRecords(mapInvoiceRecords(), ["payments", "activity", "activities"]);
    case "Recurring Invoices":
      return toRecords(getAllRecurring());
    case "Payment Receipts":
      return toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" }));
    case "Receipt Allocations":
      return childRecords(toRecords(getReceipts()), ["allocations", "applications", "invoiceAllocations"]);
    case "Credit Notes":
      return mapCreditNotes();
    case "Credit Note Items":
      return childRecords(mapCreditNotes(), ["lineItems", "items", "products"]);
    case "Renewals":
      return mapRenewals();
    case "Client Catalog":
      return mapClientCatalogRecords();
    case "Services Request Register":
      return mapServiceRequests();
    case "AMC Requests":
    case "Repair Requests":
    case "Rental Requests":
    case "Recycle and Disposal Requests":
    case "Regular Purchase Requests":
      return mapServiceRequests(module);
    case "AMC Visit Schedule":
      return childRecords(mapServiceRequests("AMC Requests"), ["visits", "visitSchedule", "appointments"]);
    case "Regular Purchase Items":
      return childRecords(mapServiceRequests("Regular Purchase Requests"), ["items", "lineItems", "products"]);
    case "Service Appointments and Assignments":
      return mapServiceRequests();
    case "Support Parent Tickets":
      return toRecords(getSupportTickets());
    case "Support Child Tickets":
      return childRecords(toRecords(getSupportTickets()), ["children", "childTickets", "subTickets"]);
    case "Ticket Conversations and Attachments":
      return childRecords(toRecords(getSupportTickets()), ["conversations", "messages", "attachments", "replies"]);
    case "Vendor Orders":
    case "Purchase Orders":
    case "Procurement Three Way Match":
      return mapPurchaseOrders();
    case "Vendor Order Items":
    case "Purchase Order Items":
      return childRecords(mapPurchaseOrders(), ["lineItems", "items", "products", "subOrders"]);
    case "Vendor PO Notes":
      return childRecords(mapPurchaseOrders(), ["notes", "activity", "activities"]);
    case "Vendor PO Documents":
      return childRecords(mapPurchaseOrders(), ["documents", "attachments", "files"]);
    case "Bills":
      return getBills();
    case "Bill Items":
      return childRecords(getBills(), ["lineItems", "items", "products"]);
    case "Payments Made":
      return getPaymentsMade();
    case "Payment Made Allocations":
      return childRecords(getPaymentsMade(), ["allocations", "applications", "billAllocations"]);
    case "Vendor Credits":
      return getVendorCredits();
    case "Vendor Credit Items":
      return childRecords(getVendorCredits(), ["lineItems", "items", "products"]);
    case "Vendor Master and Onboarding":
    case "Vendor Categories":
      return toRecords(getVendors()).map((record) => ({
        ...record,
        vendorId: record.vendorId ?? record.id,
        vendorName: record.vendorName ?? record.name,
      }));
    case "Vendor Services":
      return mapServiceRequests();
    case "Vendor Payments Overview":
      return [...getBills(), ...getPaymentsMade()];
    case "Vendor Catalog":
      return entityType === "client" ? mapClientCatalogRecords() : mapVendorProducts();
    case "Nido Users":
    case "User Invitations":
    case "User Login History":
      return toRecords(getUsers());
    case "Nido Roles":
      return toRecords(getRoles());
    case "Role Permissions":
      return mapRolePermissions();
    case "Departments and Hierarchy":
      return mapDepartments();
    case "User Notes":
      return mapUserNotesAndDocuments("notes");
    case "User Documents":
      return mapUserNotesAndDocuments("documents");
    case "Automatic Assignment Rules":
      return toRecords(getAutoAssignmentSettings().rules);
    case "Master Catalog":
    case "Product Specifications":
    case "Product Commercial Terms":
    case "Product Categories Brands and Tags":
      return toRecords(getCatalogProducts());
    case "Product Variants":
      return childRecords(toRecords(getCatalogProducts()), ["variants", "variations", "options"]);
    case "Price Engine and Vendor Comparison":
    case "Vendor Pricing Charges":
      return toRecords(getAllProductPricing());
    case "Client Pricing and Margins":
      return toRecords(getAllClientPricing());
    case "Pricing Slabs and Rules":
      return getClients().flatMap((client) =>
        getClientPriceSlabs(String(client.id)).map((slab) => ({
          ...(slab as unknown as ReportRecord),
          clientId: client.id,
          clientName: client.name,
        })),
      );
    case "Inventory Balances":
      return toRecords(getCatalogProducts()).map((product) => ({
        ...product,
        ...(getAllThresholds()[String(product.masterProductCode ?? product.id)] ?? {}),
      }));
    case "Stock Movements":
      return toRecords(getStockHistory());
    case "Goods Receipts":
      return childRecords(mapPurchaseOrders(), ["goodsReceipts", "receipts", "receivedItems"]);
    case "Returns and Cancellations": {
      const candidates = [
        ...toRecords(getOrders()).map((record) => ({ ...record, transactionType: "Sales order" })),
        ...mapPurchaseOrders().map((record) => ({ ...record, transactionType: "Purchase order" })),
        ...mapServiceRequests().map((record) => ({ ...record, transactionType: "Service request" })),
      ];
      return candidates.filter((record) => /cancel|return|refund/i.test(
        [record.status, record.type, record.requestType, record.reason].map((value) => String(value ?? "")).join(" "),
      ));
    }
    case "Approval Workflows":
    case "Approval Workflow Conditions":
    case "Approval Workflow Levels":
    case "Approval Requests":
    case "Approval Decisions and History":
    case "Approvals":
      return approvalRecordsForModule(
        module,
        getApprovalRecords().filter((record) => record.recordType === "Workflow"),
        getApprovalRecords().filter((record) => record.recordType === "Request"),
      );
    case "Vendor SLA Policies":
    case "Client SLA Tiers":
    case "Procurement SLA Stages":
    case "Service SLA Policies":
    case "Approval SLA Policies":
    case "SLA Escalation Rules":
    case "SLA Business Calendar":
    case "SLA Audit History":
    case "SLA Outcomes and Breaches":
      return mapSlaRecords(module);
    case "Client and Vendor Spend":
      return getAllFinanceRecords();
    case "Sales Revenue and Profit":
      return [
        ...toRecords(getOrders()).map((record) => ({ ...record, documentType: "Sales order" })),
        ...mapInvoiceRecords(),
        ...toRecords(getQuotes()).map((record) => ({ ...record, documentType: "Quote" })),
      ];
    case "AR and AP Ageing":
      return [...mapInvoiceRecords(), ...getBills()];
    case "Vendor Performance":
      return [
        ...toRecords(getVendors()).map((record) => ({
          ...record,
          vendorId: record.vendorId ?? record.id,
          vendorName: record.vendorName ?? record.name,
        })),
        ...mapPurchaseOrders(),
      ];
    case "Dashboard and Client Activity Summary":
      return mapClientDashboardRecords();
    case "Organization and General Settings":
      return recordsFrom(getConfig());
    case "Order Status Configuration":
      return recordsFrom(getOrderStatusConfig());
    case "Tax Audit":
      return toRecords(getTaxAuditLog());
    case "Tax Transaction Reconciliation":
      return mapTaxReconciliationRecords();
    case "Audit and Impersonation":
    case "Audit Trail":
      return getAuditRecords();
    case "Report Definitions":
      return [...toRecords(getBuiltinReportViews()), ...toRecords(getCustomReports())];
    case "Scheduled Reports":
      return toRecords(getReportCenterSchedules());
    case "Report Download and Email History":
      return toRecords(getReportCenterHistory());
    case "Expenses":
      return mapExpenses();
    case "Transactions Ledger":
      return [
        ...getAllFinanceRecords(),
        ...mapExpenses(),
        ...toRecords(getOrders()).map((record) => ({ ...record, documentType: "Sales order" })),
      ];
    default:
      return undefined;
  }
}

export function getReportCenterRecords(module: string, entityType?: ReportEntityType): ReportRecord[] {
  const liveRecords = getReportRunRecords(module, entityType);
  if (liveRecords) return liveRecords;
  switch (module) {
    case "Products / Catalog":
      return mapVendorProducts();
    case "Vendor Orders":
    case "Purchase Orders":
    case "Procurement Reports":
      return toRecords(getAllPOs());
    case "RFQs":
      throw new Error("RFQ records cannot be loaded because this installation has no RFQ request data source.");
    case "Client Orders":
      return mapClientOrderRecords();
    case "Orders":
      return toRecords(getOrders());
    case "Catalog":
    case "Inventory":
      if (module === "Inventory") return toRecords(getStockHistory());
      return entityType === "client" ? mapClientCatalogRecords() : toRecords(getCatalogProducts());
    case "Services":
      if (entityType === "client") return mapClientServiceRecords();
      return toRecords(getServiceRequests());
    case "Support":
      return toRecords(getSupportTickets());
    case "Invoices / Bills":
      if (entityType === "client") {
        return toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" }));
      }
      if (entityType === "vendor") return getBills();
      return [...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })), ...getBills()];
    case "Payments":
      if (entityType === "client") {
        return toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" }));
      }
      if (entityType === "vendor") return getPaymentsMade();
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
      return [
        ...toRecords(getVendors()).map((record) => ({
          ...record,
          vendorId: record.vendorId ?? record.id,
          vendorName: record.vendorName ?? record.name,
        })),
        ...toRecords(getAllPOs()),
      ];
    case "Client Reports":
      return [
        ...toRecords(getClients()).map((record) => ({
          ...record,
          clientId: record.clientId ?? record.id,
          clientName: record.clientName ?? record.name,
          documentType: "Client",
        })),
        ...toRecords(getOrders()),
        ...toRecords(getServiceRequests()),
        ...mapClientOrderRecords().map((record) => ({
          ...record,
          documentType: "Client order",
          documentNumber: record.orderNumber ?? record.orderId ?? record.id,
          date: record.orderDate ?? record.date,
        })),
        ...mapClientServiceRecords().map((record) => ({
          ...record,
          documentType: "Service",
          documentNumber: record.id,
          date: record.startDate,
        })),
      ];
    case "External Stakeholders":
      return [
        ...toRecords(getClients()).map((record) => ({
          ...record,
          clientId: record.clientId ?? record.id,
          clientName: record.clientName ?? record.name,
          entityType: "Client",
        })),
        ...toRecords(getVendors()).map((record) => ({
          ...record,
          vendorId: record.vendorId ?? record.id,
          vendorName: record.vendorName ?? record.name,
          entityType: getVendorStakeholderType(record),
        })),
      ];
    case "Executive Dashboard":
      return getReportRecords("All Modules");
    case "Custom Reports":
      return toRecords(getCustomReports());
    default:
      throw new Error(`Report data source is not configured for "${module}".`);
  }
}

export async function loadReportCenterRecords(module: string, entityType?: ReportEntityType): Promise<ReportRecord[]> {
  const approvalModules = new Set([
    "Approval Workflows",
    "Approval Workflow Conditions",
    "Approval Workflow Levels",
    "Approval Requests",
    "Approval Decisions and History",
    "Approvals",
  ]);
  if (!approvalModules.has(module)) return getReportCenterRecords(module, entityType);
  try {
    const bootstrap = await loadApprovalBootstrap();
    const workflows = bootstrap.workflows.map((record) => ({ ...record, recordType: "Workflow" })) as unknown as ReportRecord[];
    const requests = bootstrap.requests.map((record) => ({ ...record, recordType: "Request" })) as unknown as ReportRecord[];
    return approvalRecordsForModule(module, workflows, requests);
  } catch {
    return getReportCenterRecords(module, entityType);
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
  const path = column.split("/").map((segment) => segment.trim()).filter(Boolean);
  if (path.length > 1) {
    let current: unknown = record;
    for (const segment of path) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        current = undefined;
        break;
      }
      const key = Object.keys(current).find((candidate) => normalize(candidate) === normalize(segment));
      current = key ? (current as Record<string, unknown>)[key] : undefined;
    }
    if (current !== null && current !== undefined && current !== "") return current;
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
    "Created date": ["createdAt", "createdOn", "createdDate", "orderDate", "requestDate", "startDate", "date", "timestamp"],
    "Updated date": ["updatedAt", "modifiedAt", "lastUpdatedAt"],
    "Order date": ["orderDate", "invoiceDate", "billDate", "requestDate", "startDate", "date", "createdAt"],
    "Delivery date": ["deliveryDate", "expectedDeliveryDate", "dueDate", "endDate"],
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

